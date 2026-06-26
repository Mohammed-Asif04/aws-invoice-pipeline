<div align="center">
  <h1>🔍 AWS Event-Driven Invoice Processing Pipeline</h1>
  <p><strong>An intelligent, event-driven serverless pipeline that automates invoice ingestion, extracts financial metadata, validates taxes, flags compliance anomalies using AI, and hosts a premium reviewer dashboard.</strong></p>
</div>

---

## 🏗️ Architecture & E2E Workflow

The following architecture diagram represents the 5-stage pipeline, from ingestion to human review.

```mermaid
graph TD
    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#232F3E,font-weight:bold
    classDef lambda fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#232F3E,font-weight:bold
    classDef ai fill:#00A4A6,stroke:#232F3E,stroke-width:2px,color:#fff,font-weight:bold
    classDef db fill:#3B48CC,stroke:#232F3E,stroke-width:2px,color:#fff,font-weight:bold
    classDef ui fill:#6366f1,stroke:#232F3E,stroke-width:2px,color:#fff,font-weight:bold
    classDef step fill:#E7157B,stroke:#232F3E,stroke-width:2px,color:#fff,font-weight:bold

    %% Nodes
    A1[fa:fa-envelope Email Attachment via SES]:::ui
    A2[fa:fa-upload Drag & Drop Upload]:::ui
    B[(fa:fa-database S3 Raw Bucket)]:::aws
    C[fa:fa-bolt Lambda: Textract Processor]:::lambda
    D[fa:fa-file-text Amazon Textract AnalyzeExpense]:::ai
    E[fa:fa-bolt Lambda: Bedrock Validator]:::lambda
    F[fa:fa-brain Amazon Bedrock Claude 3]:::ai
    G{fa:fa-cogs Step Functions Orchestration}:::step
    H[(fa:fa-table DynamoDB + S3 Audit)]:::db
    I[fa:fa-exclamation-triangle Anomalies Detected]
    J[fa:fa-envelope SES Reviewer Email]:::aws
    K[fa:fa-user Human Review: Approve / Reject]:::ui

    %% Edges
    A1 --> B
    A2 --> B
    B -- S3 Event Trigger --> C
    C <--> D
    C -- Extracted JSON --> E
    E <--> F
    E -- Validation Result --> G
    G -- Happy Path --> H
    G -- Exception Path --> I
    I --> J
    J --> K
    K -- Resume Workflow --> G
```

---

## 🌟 Key Features

1. **Multi-Channel Ingestion**: Automatically extracts attachments from emails via Amazon SES or manual dashboard uploads.
2. **AI Document Understanding**: Uses Amazon Textract `AnalyzeExpense` for deep OCR extraction of fields, line items, and taxes.
3. **Claude 3 Validation**: Runs an LLM-based audit on extracted JSON to detect amount mismatches, invalid GSTIN tags, duplicate submissions, and vendor anomalies.
4. **Resilient Orchestration**: Implements AWS Step Functions with automated retries (3x backoff) and escalates timeouts (72-hour limits) to SNS alert topics.
5. **Human-in-the-Loop Web Dashboard**: Sleek React/Vite dashboard built using TailwindCSS and modern UI primitives, supporting PDF side-by-side previews, exception listings, audit trails, and KPI metrics.

---

## 📂 Project Structure

```text
├── backend/
│   ├── lambdas/
│   │   ├── invoice-ingestion/    # Receives uploads and emails
│   │   ├── textract-processor/   # OCR processing lambda
│   │   ├── bedrock-validator/    # AI Claude validation lambda
│   │   ├── approval-handler/     # API endpoints and SFN callback logic
│   │   ├── audit-logger/         # Writes events to S3 & DynamoDB
│   │   └── shared/               # Shared clients (dynamo, secrets, loggers)
│   └── step-functions/           # ASL state machine definitions
├── docs/
│   ├── api-reference.md          # Complete REST endpoint specifications
│   ├── deployment-guide.md       # Step-by-step AWS console & deployment guide
│   └── overview.md               # Detailed architectural and business overview
├── frontend/                     # React/Vite/TS dashboard UI code
├── infrastructure/               # AWS SAM templates & schema files
├── tests/                        # Vitest unit and integration suites
└── Makefile                      # Automation script shortcuts
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
make install
```

### 2. Build backend lambdas
```bash
make build
```

### 3. Run unit & integration tests
```bash
make test
```

### 4. Start frontend dashboard locally
```bash
make frontend-dev
```

### 5. Deploy to AWS
```bash
make deploy-guided
```

---

## 📘 Documentation Index

For detailed instructions, refer to:
* **Business & Architectural Overview**: Read the [Overview Document](docs/overview.md).
* **Deployment Instructions**: Read the [Deployment Guide](docs/deployment-guide.md).
* **API Documentation**: Read the [API Reference](docs/api-reference.md).