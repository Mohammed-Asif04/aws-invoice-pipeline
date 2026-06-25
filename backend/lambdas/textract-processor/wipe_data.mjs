import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const REGION = 'ap-south-1';
const RAW_BUCKET = 'invoice-pipeline-raw-116488731219';
const AUDIT_BUCKET = 'invoice-pipeline-audit-116488731219';
const INVOICE_TABLE = 'InvoiceRecords-prod';
const AUDIT_TABLE = 'AuditEntries-prod';

const s3Client = new S3Client({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });

async function emptyBucket(bucket) {
    console.log(`Emptying bucket: ${bucket}`);
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken
        }));

        if (response.Contents && response.Contents.length > 0) {
            const deleteParams = {
                Bucket: bucket,
                Delete: {
                    Objects: response.Contents.map(c => ({ Key: c.Key }))
                }
            };
            await s3Client.send(new DeleteObjectsCommand(deleteParams));
            console.log(`Deleted ${response.Contents.length} objects from ${bucket}`);
        }

        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
    }
    console.log(`Bucket ${bucket} is now empty.`);
}

async function emptyTable(tableName, keyFields) {
    console.log(`Emptying DynamoDB table: ${tableName}`);
    let lastEvaluatedKey = undefined;

    while (true) {
        const response = await dynamoClient.send(new ScanCommand({
            TableName: tableName,
            ExclusiveStartKey: lastEvaluatedKey,
        }));

        const items = response.Items || [];
        if (items.length > 0) {
            for (const item of items) {
                const key = {};
                for (const k of keyFields) {
                    key[k] = item[k];
                }
                await dynamoClient.send(new DeleteItemCommand({
                    TableName: tableName,
                    Key: key
                }));
            }
            console.log(`Deleted ${items.length} items from ${tableName}`);
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
        if (!lastEvaluatedKey) {
            break;
        }
    }
    console.log(`Table ${tableName} is now empty.`);
}

async function main() {
    try {
        console.log('Starting data wipe...');
        await Promise.all([
            emptyTable(INVOICE_TABLE, ['invoiceId', 'vendorId']),
            emptyTable(AUDIT_TABLE, ['auditId', 'timestamp'])
        ]);
        console.log('Successfully cleared all data! You are ready to test.');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

main();
