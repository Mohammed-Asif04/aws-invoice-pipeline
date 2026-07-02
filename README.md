<div align="center">
  <h1>🔍 AWS Event-Driven Invoice Processing Pipeline</h1>
  <p><strong>An intelligent, serverless pipeline that automates invoice ingestion, extracts financial metadata via OCR/AI, validates taxes and compliance using Claude, flags anomalies for human approval, and hosts a premium reviewer dashboard.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/AWS_SAM-Serverless-FF9900?logo=amazon-aws&logoColor=white" alt="AWS SAM" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Status-Complete-brightgreen" alt="Status" />
  </p>
</div>

---

## 🏗️ Architecture & E2E Workflow

The following architecture diagram represents the 5-stage pipeline, from ingestion to human review.

![Pipeline Architecture](./docs/aws_invoice_pipeline_flow.svg)

### Pipeline Stages

```
1. Upload (S3)  →  2. Document Understanding (Textract / Bedrock Fallback)  →  3. AI Validation (Claude)  →  4. Approval Workflow (Step Functions)  →  5. Store & Notify (DynamoDB + SNS)
```

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| **Multi-Channel Ingestion** | Automatically extracts attachments from emails via Amazon SES, or manual dashboard uploads with drag-and-drop |
| **AI Document Understanding** | Amazon Textract `AnalyzeExpense` for deep OCR extraction, with automatic Bedrock Converse API fallback |
| **Claude AI Validation** | LLM-based audit on extracted data — detects amount mismatches, invalid GSTIN, duplicate submissions, vendor anomalies |
| **Resilient Orchestration** | AWS Step Functions with automated retries (3× backoff), 72-hour human approval timeout, and comprehensive error handling |
| **Human-in-the-Loop Review** | Email-based approve/reject links + a full-featured React dashboard for detailed exception review with inline field corrections |
| **Complete Audit Trail** | Every pipeline event logged to DynamoDB and S3 with 7-year retention policy |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 (ARM64) · TypeScript |
| **Infrastructure** | AWS SAM (CloudFormation) |
| **Compute** | AWS Lambda (5 functions) |
| **Orchestration** | AWS Step Functions (Standard) |
| **AI/ML** | Amazon Textract · Amazon Bedrock (Claude) |
| **Storage** | Amazon S3 · Amazon DynamoDB (on-demand) |
| **Frontend** | React 18 · Vite · TypeScript |
| **Hosting** | AWS Amplify |
| **Messaging** | Amazon SES · Amazon SNS |
| **API** | Amazon API Gateway (REST) |

---

## 📂 Project Structure

```text
aws-invoice-pipeline/
├── backend/
│   ├── lambdas/
│   │   ├── invoice-ingestion/    # Receives uploads and SES emails → S3 → starts pipeline
│   │   ├── textract-processor/   # OCR extraction (Textract + Bedrock fallback)
│   │   ├── bedrock-validator/    # AI validation — anomaly detection with Claude
│   │   ├── approval-handler/     # API endpoints, email callbacks, SFN task token handling
│   │   ├── audit-logger/         # Persists pipeline results, writes audit trail to S3 + DynamoDB
│   │   └── shared/               # Shared clients (DynamoDB, Secrets Manager, Logger, Types)
│   └── step-functions/           # ASL state machine definitions
├── frontend/                     # React + Vite + TypeScript dashboard UI
├── infrastructure/               # AWS SAM template, IAM roles, S3 policies, DynamoDB schemas
├── tests/                        # Vitest unit and integration test suites
├── docs/                         # API reference, deployment guide, architecture overview
└── Makefile                      # Build/deploy automation shortcuts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ · **PNPM** · **AWS CLI** v2+ (configured) · **AWS SAM CLI** v1.100+

### 1. Install dependencies

```bash
make install
```

### 2. Build backend Lambdas

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
# First-time guided deployment (interactive)
make deploy-guided

# Subsequent deployments
make deploy
```

> 📖 For detailed deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

---

## 🧪 Testing

Tests are written with **Vitest** and located in the `tests/` directory.

```bash
make test
```

| Test Suite | File | What It Tests |
|---|---|---|
| Textract Unit | `tests/unit/textract.test.ts` | Textract response parsing, field mapping, GSTIN detection, amount parsing |
| Bedrock Unit | `tests/unit/bedrock.test.ts` | Anomaly detection rules, validation prompt, response parsing, status determination |
| Approval Unit | `tests/unit/approval.test.ts` | Approval/reject/reprocess actions, corrected fields, email callbacks |
| Integration | `tests/integration/pipeline.test.ts` | Full pipeline flow from ingestion to persistence |

---

## 📘 Documentation Index

| Document | Description |
|---|---|
| [**Overview**](docs/overview.md) | Business context, architecture, component breakdown, UI specifications, repo structure |
| [**API Reference**](docs/api-reference.md) | Complete REST API specification — all endpoints, request/response schemas, data models, DynamoDB tables |
| [**Deployment Guide**](docs/deployment-guide.md) | Prerequisites, build, deploy, post-deploy config, monitoring, troubleshooting, cost estimation |
| [**Sample Audit Report**](docs/sample-audit-report.json) | Example JSON audit report from a fully processed invoice |

---

## 🔑 Key AWS Services

| Service | Role |
|---|---|
| **Amazon SES** | Receives inbound invoices via email, sends approval notification emails |
| **Amazon S3** | Raw PDF storage + long-term audit trail retention (7-year lifecycle) |
| **AWS Lambda** | 5 event-driven functions: ingestion, extraction, validation, approval, audit |
| **Amazon Textract** | OCR extraction via `AnalyzeExpense` API (with Bedrock fallback) |
| **Amazon Bedrock** | Claude-based AI validation + fallback document extraction |
| **AWS Step Functions** | Workflow orchestration — retries, timeouts, human-in-the-loop approval |
| **Amazon DynamoDB** | Operational data store (on-demand billing, PITR enabled) |
| **Amazon API Gateway** | REST API serving the frontend and email callback endpoints |
| **AWS Amplify** | Hosts the React reviewer dashboard |
| **Amazon SNS** | Pipeline completion notifications |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built as a capstone project. See the repository for license details.