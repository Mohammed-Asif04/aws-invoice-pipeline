# AWS Invoice Pipeline — API Reference

This document provides a comprehensive, code-driven reference of all API Gateway endpoints deployed for the AWS Invoice Processing Pipeline. All REST API endpoints are secured via AWS API Gateway and route to either the `invoice-ingestion` Lambda (for uploads) or the `approval-handler` Lambda (for approvals and data retrieval).

## 🚀 Base Architecture

- **Protocol**: HTTPS / REST
- **CORS**: Enabled for all origins (`*`), supporting `GET`, `POST`, `OPTIONS`.
- **Base URL (Example)**: `https://<api-id>.execute-api.<region>.amazonaws.com/<env>`
- **Content-Type**: `application/json` (except for email callback endpoints which return `text/html`).

---

## 📂 1. Ingestion Endpoints

Handled by the **`invoice-ingestion`** Lambda function.

### `POST /upload`
Directly uploads an invoice document (PDF) into the pipeline.

- **Headers**:
  - `Content-Type`: `multipart/form-data` OR `application/pdf` (base64 encoded via API Gateway)
  - `X-Filename`: (Optional) Original filename of the upload
  - `X-Invoice-Metadata`: (Optional) JSON string containing manual form fields from the UI (Vendor, PO Number, etc.)

- **Request Body**:
  The raw binary PDF file or a base64 encoded string if sent directly via API Gateway proxy.

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "invoiceId": "INV-2026-A1B2C3D4",
    "message": "Invoice uploaded and pipeline started"
  }
  ```

- **Error Responses**:
  - `400 Bad Request`: "No file data provided"
  - `405 Method Not Allowed`: "Method not allowed"

---

## 📝 2. Email Callback Endpoints

Handled by the **`approval-handler`** Lambda function. These endpoints are triggered via hyperlinks injected into SES emails.

### `GET /approve`
Approves an invoice directly from an email notification.

- **Query Parameters**:
  - `token` (Required): Step Functions task token.
  - `invoiceId` (Required): ID of the invoice.

- **Success Response (200 OK)**:
  Returns a rendered HTML page confirming the invoice was approved. The Step Functions workflow resumes with a `SendTaskSuccess` command.

### `GET /reject`
Rejects an invoice directly from an email notification.

- **Query Parameters**:
  - `token` (Required): Step Functions task token.
  - `invoiceId` (Required): ID of the invoice.

- **Success Response (200 OK)**:
  Returns a rendered HTML page confirming the invoice was rejected. The Step Functions workflow resumes with a `SendTaskFailure` command.

---

## 🛠️ 3. Dashboard & Operations Endpoints

Handled by the **`approval-handler`** Lambda function. These are consumed by the React (Vite) frontend.

### `GET /dashboard`
Retrieves aggregated statistics across the entire database to power dashboard KPIs.

- **Query Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "totalInvoices": 150,
    "processed": 120,
    "inProgress": 10,
    "exceptions": 15,
    "inReview": 3,
    "pendingReview": 2,
    "resolved": 0,
    "processedPercentage": "80.0",
    "exceptionPercentage": "10.0"
  }
  ```

### `GET /invoices`
Retrieves a paginated list of all invoices.

- **Query Parameters**:
  - `status` (Optional): Filter by `InvoiceStatus` (e.g., `PROCESSED`, `IN_REVIEW`).
  - `pageSize` (Optional, Default `25`): Limit results per page.
  - `lastKey` (Optional): JSON string representation of DynamoDB LastEvaluatedKey for pagination.

- **Success Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "invoiceId": "INV-...",
        "vendorName": "Acme Corp",
        "totalAmount": 1000.00,
        "status": "PROCESSED"
      }
    ],
    "total": 1,
    "hasMore": false
  }
  ```

### `GET /invoices/{invoiceId}`
Retrieves complete details of a specific invoice along with its audit history.

- **Path Parameters**:
  - `invoiceId` (Required): The ID of the target invoice.

- **Success Response (200 OK)**:
  ```json
  {
    "invoice": {
      "invoiceId": "INV-...",
      "vendorName": "Acme Corp",
      "lineItems": [],
      "anomalies": []
    },
    "auditLogs": [
      {
        "eventType": "INGESTION",
        "event": "Invoice received via email",
        "timestamp": "2026-06-25T12:00:00Z"
      }
    ]
  }
  ```

### `GET /exceptions`
Retrieves all invoices that have encountered anomalies or require manual review.

- **Query Parameters**:
  - `pageSize` (Optional, Default `25`): Pagination limit.

- **Success Response (200 OK)**:
  Returns a combined list of invoices with statuses `EXCEPTION`, `IN_REVIEW`, `PENDING_REVIEW`, and `RESOLVED`.
  ```json
  {
    "items": [],
    "total": 0,
    "stats": {
      "totalExceptions": 0,
      "pendingReview": 0,
      "inProgress": 0,
      "resolved": 0
    }
  }
  ```

### `GET /audit`
Queries the audit log table directly for a specific invoice's history.

- **Query Parameters**:
  - `invoiceId` (Required): The target invoice ID.

- **Success Response (200 OK)**:
  ```json
  {
    "entries": [
      {
        "auditId": "...",
        "eventType": "VALIDATION",
        "details": "..."
      }
    ]
  }
  ```

---

## 🎯 4. Workflow Actions

### `POST /approvals`
Submits a review decision (Approve, Reject, or Reprocess) from the dashboard UI. Handles dynamic updates to extracted fields (like fixing an amount or GSTIN manually).

- **Request Body**:
  ```json
  {
    "invoiceId": "INV-2026-...",
    "action": "APPROVE", 
    "taskToken": "AAAAKgAAAAIA...", 
    "reviewer": "Admin User",
    "comments": "Fixed subtotal mismatch",
    "correctedFields": {
      "INV-2026-...-subtotal": 500.00
    }
  }
  ```

- **Behavior**:
  - `APPROVE`: Updates DB fields using `correctedFields`. Sets status to `PROCESSED`. Resumes Step Functions workflow via `SendTaskSuccess`. Clears anomalies.
  - `REJECT`: Sets status to `RESOLVED`. Logs rejection comments. Resumes workflow via `SendTaskFailure`.
  - `REPROCESS`: Reverts status to `IN_PROGRESS`. (Allows manual trigger back to extraction).

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "invoiceId": "INV-2026-...",
    "action": "APPROVE",
    "message": "Invoice approved successfully"
  }
  ```
