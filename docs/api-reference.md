# 📖 API Reference — AWS Invoice Pipeline

This document details the REST API endpoints provided by the **API Gateway** layer of the AWS Invoice Processing Pipeline. The endpoints route requests to the `approval-handler` Lambda.

## 🔗 Base URL
* **Deployed API Gateway URL**: `https://<api-id>.execute-api.<region>.amazonaws.com/prod`
* **Local Development (SAM local)**: `http://localhost:3000`

---

## 🚦 Endpoints Summary

| Method | Path | Description | Access |
|:---|:---|:---|:---|
| **GET** | `/approve` | Callback link from email to approve invoice | Public (signed links) |
| **GET** | `/reject` | Callback link from email to reject invoice | Public (signed links) |
| **POST** | `/approvals` | Perform approval, rejection, or reprocessing | Authenticated |
| **GET** | `/invoices` | List, search, and paginate processed invoices | Authenticated |
| **GET** | `/invoices/{invoiceId}` | Fetch details & audit logs for a single invoice | Authenticated |
| **GET** | `/exceptions` | List invoices requiring manual review / flags | Authenticated |
| **GET** | `/audit` | Query audit log history for a specific invoice | Authenticated |
| **GET** | `/dashboard` | Retrieve high-level operational metrics | Authenticated |

---

## 📝 Detailed Endpoints

### 1. Email Approval Callback (`GET /approve`)
Invoked when a reviewer clicks the **Approve** button in their review request email. Resumes the Step Functions workflow and redirects the user to an HTML success page.

* **Query Parameters**:
  * `token` (String, Required): Step Functions execution task token.
  * `invoiceId` (String, Required): The target invoice ID.

* **Response (200 OK)**:
  * **Content-Type**: `text/html`
  * **Body**: Responsive HTML confirmation page.

* **Error Response (400 Bad Request)**:
  * **Content-Type**: `application/json`
  * `{ "error": "Missing token or invoiceId" }`

---

### 2. Email Rejection Callback (`GET /reject`)
Invoked when a reviewer clicks the **Reject** button in their review request email. Resumes the Step Functions workflow with a failure code and redirects the user to an HTML success page.

* **Query Parameters**:
  * `token` (String, Required): Step Functions execution task token.
  * `invoiceId` (String, Required): The target invoice ID.

* **Response (200 OK)**:
  * **Content-Type**: `text/html`
  * **Body**: Responsive HTML confirmation page.

---

### 3. Handle Invoice Action (`POST /approvals`)
Submits review decisions (Approve, Reject, Reprocess) from the React UI dashboard.

* **Request Headers**:
  * `Content-Type: application/json`

* **Request Body**:
```json
{
  "invoiceId": "inv-10023-xyz",
  "action": "APPROVE", 
  "taskToken": "AAAAKgAAAAIAAAAAAAAAAY...", // Optional: required only if resuming Step Functions
  "reviewer": "Reviewer Team A",
  "comments": "Totals matched. Standard approval given.",
  "correctedFields": {
    "gstin": "27AAAAA1111A1Z1"
  }
}
```
* **Actions Supported**:
  * `APPROVE`: Marks status as `PROCESSED` and resumes workflow.
  * `REJECT`: Marks status as `RESOLVED` and halts workflow with rejection audit.
  * `REPROCESS`: Re-routes the invoice back into the Textract extraction pipeline.

* **Response (200 OK)**:
```json
{
  "success": true,
  "invoiceId": "inv-10023-xyz",
  "action": "APPROVE",
  "message": "Invoice approved successfully"
}
```

---

### 4. Fetch Invoices (`GET /invoices`)
Lists all processed or in-progress invoices.

* **Query Parameters**:
  * `status` (String, Optional): Filter by status (`PROCESSED`, `IN_REVIEW`, `EXCEPTION`, `IN_PROGRESS`, `RESOLVED`).
  * `pageSize` (Number, Optional): Number of records to return (default: `25`).
  * `lastKey` (JSON String, Optional): Pagination token returned from the previous page's `lastKey`.

* **Response (200 OK)**:
```json
{
  "items": [
    {
      "invoiceId": "inv_101",
      "vendorName": "ACME Corp",
      "invoiceNumber": "INV-12345",
      "totalAmount": 1180.00,
      "status": "PROCESSED",
      "createdAt": "2026-06-24T12:00:00.000Z",
      "updatedAt": "2026-06-24T12:05:00.000Z"
    }
  ],
  "lastKey": "{\"invoiceId\":\"inv_101\",\"vendorId\":\"ACME Corp\"}"
}
```

---

### 5. Fetch Invoice Details (`GET /invoices/{invoiceId}`)
Gets detailed metadata, extracted line items, anomalies, and audit log history for a single invoice.

* **Path Parameters**:
  * `invoiceId` (String, Required): Unique ID of the invoice.

* **Response (200 OK)**:
```json
{
  "invoice": {
    "invoiceId": "inv-10023",
    "vendorId": "PENDING",
    "vendorName": "Acme Software Solutions Ltd",
    "invoiceNumber": "INV-2026-001",
    "invoiceDate": "2026-06-20",
    "lineItems": [
      {
        "description": "Cloud Consulting Services",
        "quantity": 10,
        "unitPrice": 100.00,
        "amount": 1000.00,
        "hsnSac": "998311"
      }
    ],
    "subtotal": 1000.00,
    "cgst": 90.00,
    "sgst": 90.00,
    "totalAmount": 1180.00,
    "status": "PROCESSED",
    "extractionConfidence": 94,
    "s3ExtractedJsonKey": "textract/inv-10023/raw-response.json"
  },
  "auditLogs": [
    {
      "auditId": "a811c-9923...",
      "invoiceId": "inv-10023",
      "event": "AI validation completed",
      "eventType": "VALIDATION",
      "timestamp": "2026-06-24T12:02:00.000Z",
      "user": "system",
      "details": "Bedrock validation completed successfully."
    }
  ]
}
```

---

### 6. Get Dashboard Stats (`GET /dashboard`)
Retrieves statistics to populate KPI cards and trend charts on the landing page of the React UI.

* **Response (200 OK)**:
```json
{
  "total": 150,
  "processed": 120,
  "inProgress": 10,
  "exceptions": 15,
  "inReview": 5,
  "exceptionPercentage": "10.0",
  "monthlyTrend": [
    { "month": "June", "processed": 45, "exceptions": 3 }
  ],
  "vendorMetrics": [
    { "vendorName": "ACME Corp", "totalVolume": 15, "accuracyRate": "98.5" }
  ]
}
```
