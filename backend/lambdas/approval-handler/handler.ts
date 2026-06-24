// ============================================================================
// Lambda: Approval Handler
// Handles approve/reject/reprocess callbacks from email links & React UI
// Uses Step Functions SendTaskSuccess/SendTaskFailure to resume workflows
// Also serves as API Gateway handler for the approval endpoints
// ============================================================================

import {
  SFNClient,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from '@aws-sdk/client-sfn';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createLogger } from '../shared/logger';
import {
  updateInvoice,
  putAuditEntry,
  getInvoice,
  scanInvoices,
  queryInvoicesByStatus,
  getAuditEntriesForInvoice,
} from '../shared/dynamodb';
import type {
  ApprovalCallbackPayload,
  InvoiceRecord,
  AuditEntry,
  LambdaResponse,
  InvoiceStatus,
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('approval-handler');

const sfnClient = new SFNClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

import { APIGatewayClient, GetRestApisCommand } from '@aws-sdk/client-api-gateway';

const apigatewayClient = new APIGatewayClient({ region: process.env.AWS_REGION || 'ap-south-1' });

let cachedApiUrl: string | null = null;

async function getApprovalApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;
  
  const envUrl = process.env.APPROVAL_API_URL || '';
  if (envUrl && !envUrl.includes('PLACEHOLDER') && envUrl.startsWith('http')) {
    cachedApiUrl = envUrl;
    return envUrl;
  }
  
  try {
    const response = await apigatewayClient.send(new GetRestApisCommand({}));
    const env = process.env.ENVIRONMENT || 'prod';
    const targetName = `InvoicePipelineAPI-${env}`;
    const api = response.items?.find(item => item.name === targetName);
    if (api && api.id) {
      cachedApiUrl = `https://${api.id}.execute-api.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${env}`;
      logger.info('Auto-discovered API Gateway URL', { url: cachedApiUrl });
      return cachedApiUrl;
    }
  } catch (error) {
    logger.error('Failed to auto-discover API Gateway URL', { error });
  }
  
  return envUrl;
}
const SES_SENDER_EMAIL = process.env.SES_SENDER_EMAIL || 'noreply@invoice-pipeline.example.com';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';

// ---------------------------------------------------------------------------
// API Gateway Event Types
// ---------------------------------------------------------------------------

interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  resource: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  headers: Record<string, string>;
  body: string | null;
  isBase64Encoded: boolean;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Main Handler — Routes API Gateway requests
// ---------------------------------------------------------------------------

export async function handler(event: APIGatewayProxyEvent): Promise<LambdaResponse> {
  logger.info('Approval handler invoked', {
    method: event.httpMethod,
    path: event.path,
    resource: event.resource,
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // Route based on path and method
    const path = event.path || event.resource || '';

    // --- Approval callback (from email links) ---
    if (path.includes('/approve') && event.httpMethod === 'GET') {
      return await handleEmailCallback(event, 'APPROVE');
    }
    if (path.includes('/reject') && event.httpMethod === 'GET') {
      return await handleEmailCallback(event, 'REJECT');
    }

    // --- API endpoints for React frontend ---
    if (path.includes('/approvals') && event.httpMethod === 'POST') {
      return await handleApprovalAction(event);
    }
    if (path.includes('/invoices') && event.httpMethod === 'GET') {
      return await handleGetInvoices(event);
    }
    if (path.match(/\/invoices\/[^/]+/) && event.httpMethod === 'GET') {
      return await handleGetInvoiceDetail(event);
    }
    if (path.includes('/exceptions') && event.httpMethod === 'GET') {
      return await handleGetExceptions(event);
    }
    if (path.includes('/audit') && event.httpMethod === 'GET') {
      return await handleGetAuditLogs(event);
    }
    if (path.includes('/dashboard') && event.httpMethod === 'GET') {
      return await handleGetDashboardStats(event);
    }

    return respond(404, { error: 'Not found', path });
  } catch (error) {
    logger.error('Request failed', error);
    return respond(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ---------------------------------------------------------------------------
// Handle Email Callback (approve/reject links from email)
// ---------------------------------------------------------------------------

async function handleEmailCallback(
  event: APIGatewayProxyEvent,
  action: 'APPROVE' | 'REJECT'
): Promise<LambdaResponse> {
  const params = event.queryStringParameters || {};
  const taskToken = params.token;
  const invoiceId = params.invoiceId;

  if (!taskToken || !invoiceId) {
    return respond(400, { error: 'Missing token or invoiceId' });
  }

  logger.info('Processing email callback', { invoiceId, action });

  try {
    if (action === 'APPROVE') {
      await sfnClient.send(
        new SendTaskSuccessCommand({
          taskToken,
          output: JSON.stringify({
            action: 'APPROVE',
            invoiceId,
            reviewer: 'email-callback',
            timestamp: new Date().toISOString(),
          }),
        })
      );

      await updateInvoice(invoiceId, 'PENDING', {
        status: 'PROCESSED',
        approvedBy: 'email-callback',
        approvalTimestamp: new Date().toISOString(),
      });
    } else {
      await sfnClient.send(
        new SendTaskFailureCommand({
          taskToken,
          error: 'REJECTED',
          cause: `Invoice rejected via email by reviewer`,
        })
      );

      await updateInvoice(invoiceId, 'PENDING', {
        status: 'RESOLVED',
        approvedBy: 'email-callback',
        approvalTimestamp: new Date().toISOString(),
        approvalComments: 'Rejected via email link',
      });
    }

    // Audit entry
    await putAuditEntry({
      auditId: uuidv4(),
      invoiceId,
      event: `Invoice ${action.toLowerCase()}d via email`,
      eventType: action === 'APPROVE' ? 'APPROVAL' : 'REJECTION',
      timestamp: new Date().toISOString(),
      user: 'email-callback',
      details: `Invoice ${invoiceId} was ${action.toLowerCase()}d via email callback link`,
    });

    // Return a simple HTML page for the email user
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `<!DOCTYPE html>
<html>
<head><title>Invoice ${action === 'APPROVE' ? 'Approved' : 'Rejected'}</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
  .card { background: white; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
  .icon { font-size: 48px; margin-bottom: 1rem; }
  h1 { font-size: 1.5rem; color: #1a1d2e; margin: 0.5rem 0; }
  p { color: #6b7280; font-size: 0.95rem; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">${action === 'APPROVE' ? '✅' : '❌'}</div>
    <h1>Invoice ${action === 'APPROVE' ? 'Approved' : 'Rejected'}</h1>
    <p>Invoice <strong>${invoiceId}</strong> has been ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.</p>
    <p>You can close this window.</p>
  </div>
</body>
</html>`,
    };
  } catch (error) {
    logger.error('Email callback processing failed', error);
    return respond(500, { error: 'Failed to process callback' });
  }
}

// ---------------------------------------------------------------------------
// Handle Approval Actions (from React UI)
// ---------------------------------------------------------------------------

async function handleApprovalAction(
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> {
  const body: ApprovalCallbackPayload = JSON.parse(event.body || '{}');
  const { invoiceId, action, taskToken, reviewer, comments, correctedFields } = body;

  if (!invoiceId || !action) {
    return respond(400, { error: 'Missing invoiceId or action' });
  }

  logger.info('Processing approval action', { invoiceId, action, reviewer });

  try {
    switch (action) {
      case 'APPROVE': {
        // Resume Step Functions with success
        if (taskToken) {
          await sfnClient.send(
            new SendTaskSuccessCommand({
              taskToken,
              output: JSON.stringify({
                action: 'APPROVE',
                invoiceId,
                reviewer,
                comments,
                correctedFields,
                timestamp: new Date().toISOString(),
              }),
            })
          );
        }

        await updateInvoice(invoiceId, 'PENDING', {
          status: 'PROCESSED',
          approvedBy: reviewer,
          approvalTimestamp: new Date().toISOString(),
          approvalComments: comments,
        });

        await putAuditEntry({
          auditId: uuidv4(),
          invoiceId,
          event: 'Invoice approved',
          eventType: 'APPROVAL',
          timestamp: new Date().toISOString(),
          user: reviewer,
          details: comments || 'Approved via dashboard',
        });

        break;
      }

      case 'REJECT': {
        if (taskToken) {
          await sfnClient.send(
            new SendTaskFailureCommand({
              taskToken,
              error: 'REJECTED',
              cause: comments || `Rejected by ${reviewer}`,
            })
          );
        }

        await updateInvoice(invoiceId, 'PENDING', {
          status: 'RESOLVED',
          approvedBy: reviewer,
          approvalTimestamp: new Date().toISOString(),
          approvalComments: comments,
        });

        await putAuditEntry({
          auditId: uuidv4(),
          invoiceId,
          event: 'Invoice rejected',
          eventType: 'REJECTION',
          timestamp: new Date().toISOString(),
          user: reviewer,
          details: comments || 'Rejected via dashboard',
        });

        break;
      }

      case 'REPROCESS': {
        // Update status back to IN_PROGRESS for re-processing
        await updateInvoice(invoiceId, 'PENDING', {
          status: 'IN_PROGRESS',
          anomalies: [],
        });

        await putAuditEntry({
          auditId: uuidv4(),
          invoiceId,
          event: 'Invoice sent for reprocessing',
          eventType: 'REPROCESS',
          timestamp: new Date().toISOString(),
          user: reviewer,
          details: comments || 'Reprocess requested via dashboard',
        });

        // Note: In a full implementation, this would re-trigger the Step Functions
        // execution with the corrected fields

        break;
      }
    }

    // Send notification
    await sendNotification(invoiceId, action, reviewer);

    return respond(200, {
      success: true,
      invoiceId,
      action,
      message: `Invoice ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    logger.error('Approval action failed', error);
    return respond(500, {
      error: 'Approval action failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ---------------------------------------------------------------------------
// API: Get Invoices (list)
// ---------------------------------------------------------------------------

async function handleGetInvoices(
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> {
  const params = event.queryStringParameters || {};
  const status = params.status as InvoiceStatus | undefined;
  const limit = parseInt(params.pageSize || '25');
  const lastKey = params.lastKey ? JSON.parse(params.lastKey) : undefined;

  const result = status
    ? await queryInvoicesByStatus(status, limit, lastKey)
    : await scanInvoices(limit, lastKey);

  return respond(200, result);
}

// ---------------------------------------------------------------------------
// API: Get Invoice Detail
// ---------------------------------------------------------------------------

async function handleGetInvoiceDetail(
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> {
  const invoiceId = event.pathParameters?.invoiceId ||
    event.path.split('/').pop() || '';

  if (!invoiceId) {
    return respond(400, { error: 'Missing invoiceId' });
  }

  const invoice = await getInvoice(invoiceId, 'PENDING');
  if (!invoice) {
    return respond(404, { error: 'Invoice not found' });
  }

  // Also fetch audit logs for this invoice
  const auditLogs = await getAuditEntriesForInvoice(invoiceId);

  return respond(200, { invoice, auditLogs });
}

// ---------------------------------------------------------------------------
// API: Get Exceptions (filtered by exception statuses)
// ---------------------------------------------------------------------------

async function handleGetExceptions(
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> {
  const params = event.queryStringParameters || {};
  const limit = parseInt(params.pageSize || '25');

  // Fetch invoices with exception-related statuses
  const [exceptions, inReview, pendingReview] = await Promise.all([
    queryInvoicesByStatus('EXCEPTION', limit),
    queryInvoicesByStatus('IN_REVIEW', limit),
    queryInvoicesByStatus('PENDING_REVIEW', limit),
  ]);

  const allExceptions = [
    ...exceptions.items,
    ...inReview.items,
    ...pendingReview.items,
  ];

  return respond(200, {
    items: allExceptions,
    total: allExceptions.length,
    stats: {
      totalExceptions: allExceptions.length,
      pendingReview: pendingReview.items.length,
      inProgress: inReview.items.length,
      resolved: 0, // Would need separate query
    },
  });
}

// ---------------------------------------------------------------------------
// API: Get Audit Logs
// ---------------------------------------------------------------------------

async function handleGetAuditLogs(
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> {
  const params = event.queryStringParameters || {};
  const invoiceId = params.invoiceId;

  if (!invoiceId) {
    return respond(400, { error: 'Missing invoiceId query parameter' });
  }

  const entries = await getAuditEntriesForInvoice(invoiceId);
  return respond(200, { entries });
}

// ---------------------------------------------------------------------------
// API: Dashboard Stats
// ---------------------------------------------------------------------------

async function handleGetDashboardStats(
  _event: APIGatewayProxyEvent
): Promise<LambdaResponse> {
  // Fetch counts for each status
  const [processed, inProgress, exceptions, inReview] = await Promise.all([
    queryInvoicesByStatus('PROCESSED', 1),
    queryInvoicesByStatus('IN_PROGRESS', 1),
    queryInvoicesByStatus('EXCEPTION', 1),
    queryInvoicesByStatus('IN_REVIEW', 1),
  ]);

  const total = processed.total + inProgress.total + exceptions.total + inReview.total;

  return respond(200, {
    totalInvoices: total,
    processed: processed.total,
    inProgress: inProgress.total,
    exceptions: exceptions.total,
    inReview: inReview.total,
    processedPercentage: total > 0 ? ((processed.total / total) * 100).toFixed(1) : '0',
    exceptionPercentage: total > 0 ? ((exceptions.total / total) * 100).toFixed(1) : '0',
  });
}

// ---------------------------------------------------------------------------
// Send Notification (SNS/SES)
// ---------------------------------------------------------------------------

async function sendNotification(
  invoiceId: string,
  action: string,
  reviewer: string
): Promise<void> {
  try {
    if (SNS_TOPIC_ARN) {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `Invoice ${invoiceId} — ${action}`,
          Message: JSON.stringify({
            invoiceId,
            action,
            reviewer,
            timestamp: new Date().toISOString(),
          }),
        })
      );
    }
  } catch (error) {
    logger.warn('Failed to send notification', { invoiceId, error: String(error) });
    // Non-critical — don't throw
  }
}

// ---------------------------------------------------------------------------
// Send Approval Request Email (called by Step Functions)
// ---------------------------------------------------------------------------

export async function sendApprovalEmail(event: {
  invoiceId: string;
  vendorName: string;
  totalAmount: number;
  anomalies: string[];
  taskToken: string;
  assignedTo: string;
  assignedToEmail: string;
}): Promise<void> {
  const {
    invoiceId,
    vendorName,
    totalAmount,
    anomalies,
    taskToken,
    assignedToEmail,
  } = event;

  const apiBaseUrl = await getApprovalApiUrl();
  const approveUrl = `${apiBaseUrl}/approve?token=${encodeURIComponent(taskToken)}&invoiceId=${invoiceId}`;
  const rejectUrl = `${apiBaseUrl}/reject?token=${encodeURIComponent(taskToken)}&invoiceId=${invoiceId}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .info-item { background: #f8f9fa; border-radius: 8px; padding: 12px 16px; }
    .info-item label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item p { margin: 4px 0 0; font-weight: 600; color: #1a1d2e; }
    .anomalies { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .anomalies h3 { color: #dc2626; margin: 0 0 8px; font-size: 14px; }
    .anomalies li { color: #7f1d1d; font-size: 13px; margin: 4px 0; }
    .actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; flex: 1; }
    .btn-approve { background: #10b981; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { border-top: 1px solid #e5e7eb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Invoice Review Required</h1>
      <p>An invoice requires your attention</p>
    </div>
    <div class="body">
      <div class="info-grid">
        <div class="info-item">
          <label>Invoice ID</label>
          <p>${invoiceId}</p>
        </div>
        <div class="info-item">
          <label>Vendor</label>
          <p>${vendorName}</p>
        </div>
        <div class="info-item">
          <label>Amount</label>
          <p>₹${totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div class="info-item">
          <label>Issues Found</label>
          <p>${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'}</p>
        </div>
      </div>

      ${anomalies.length > 0 ? `
      <div class="anomalies">
        <h3>⚠️ Detected Issues</h3>
        <ul>
          ${anomalies.map((a) => `<li>${a}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <div class="actions">
        <a href="${approveUrl}" class="btn btn-approve">✅ Approve</a>
        <a href="${rejectUrl}" class="btn btn-reject">❌ Reject</a>
      </div>
    </div>
    <div class="footer">
      <p>AWS Invoice Processing Pipeline — Automated Review System</p>
    </div>
  </div>
</body>
</html>`;

  await sesClient.send(
    new SendEmailCommand({
      Source: SES_SENDER_EMAIL,
      Destination: { ToAddresses: [assignedToEmail] },
      Message: {
        Subject: { Data: `[Action Required] Invoice ${invoiceId} from ${vendorName} — Review Needed` },
        Body: {
          Html: { Data: emailHtml },
          Text: {
            Data: `Invoice ${invoiceId} from ${vendorName} (₹${totalAmount.toLocaleString('en-IN')}) requires your review.\n\nApprove: ${approveUrl}\nReject: ${rejectUrl}`,
          },
        },
      },
    })
  );

  logger.info('Approval email sent', { invoiceId, assignedToEmail });
}

// ---------------------------------------------------------------------------
// Helper: Build API response
// ---------------------------------------------------------------------------

function respond(statusCode: number, body: unknown): LambdaResponse {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}
