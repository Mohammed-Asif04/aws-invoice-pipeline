# AWS Invoice Pipeline — Deployment Guide

This guide provides step-by-step instructions for deploying the AWS Invoice Processing Pipeline into your AWS Account. 

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- **Node.js**: v20 or later.
- **PNPM**: Package manager (`npm install -g pnpm`).
- **AWS CLI**: Configured with an IAM user that has administrative privileges (`aws configure`).
- **AWS SAM CLI**: Installed for building and deploying the Serverless Application Model infrastructure.
- **Git**: For version control.

## 🏗️ 1. Preparing the Backend

The backend is composed of several AWS Lambda functions written in TypeScript. We use `esbuild` (integrated with SAM) to compile the TypeScript code, but you must first install the dependencies.

From the root of the project, use the provided `Makefile`:

```bash
# This installs pnpm dependencies for all 5 Lambdas and the frontend
make install
```

## 🔐 2. Configuring Secrets and Environment

### Bedrock Model Access
Ensure your AWS Account has access to the **Anthropic Claude 3 Haiku** model in Amazon Bedrock.
1. Navigate to the **Amazon Bedrock** console.
2. Go to **Model access** in the sidebar.
3. Request access to `Anthropic Claude 3 Haiku` if not already granted.

### SES Email Verification
The pipeline sends email notifications and receives emails. You must verify your sender email address in Amazon SES.
1. Navigate to the **Amazon SES** console.
2. Go to **Verified identities** and create a new identity for your email address (e.g., `admin@yourdomain.com`).
3. Click the verification link sent to that email.

## 🚀 3. Building and Deploying Infrastructure (AWS SAM)

The entire backend infrastructure (S3, DynamoDB, API Gateway, Step Functions, Lambda, SNS, SES permissions) is defined in `infrastructure/template.yaml`.

### Step 3.1: Build the Application
Use SAM to bundle and build the TypeScript Lambdas:

```bash
make build
# This runs: sam build -t infrastructure/template.yaml --build-in-source
```

### Step 3.2: Deploy to AWS
For the very first deployment, perform a guided deployment to set up your environment variables (like emails and model configurations):

```bash
make deploy-guided
# This runs: sam deploy --guided -t .aws-sam/build/template.yaml
```

**During the guided deployment, you will be prompted for parameters:**
- **Stack Name**: e.g., `aws-invoice-pipeline`
- **AWS Region**: e.g., `ap-south-1`
- **Environment**: e.g., `prod`
- **ReviewerEmail**: The email address where exceptions should be sent for approval.
- **SenderEmail**: The SES-verified email address to send emails *from*.
- **BedrockModelId**: Keep default (`anthropic.claude-3-haiku-20240307-v1:0`).
- **ConfidenceThreshold**: Keep default (`85`).
- **Allow SAM CLI IAM role creation**: `Y`
- **Disable rollback**: `Y` (recommended for development)

After the guided deployment succeeds, SAM will save your choices to `samconfig.toml`. For subsequent deployments, simply run:
```bash
make deploy
```

### Step 3.3: Note the Outputs
Once deployed, SAM will output several important values. Make a note of:
- `ApiEndpoint` (e.g., `https://xyz.execute-api.region.amazonaws.com/prod/`)
- `RawBucketName`
- `AuditBucketName`

## 💻 4. Deploying the React Frontend

The React UI (`frontend/`) is deployed using **AWS Amplify**. 

1. Ensure the backend is deployed successfully.
2. The frontend requires environment variables to talk to the API. Create a `.env` file in the `frontend/` directory:
   ```bash
   VITE_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/prod
   ```
3. Our pipeline uses an AWS Amplify deployment script. Run the following command from the root directory to build and deploy the React application directly to Amplify hosting:
   ```bash
   ./deploy_frontend.sh
   ```
4. Wait for the deployment to complete. The script will output the **Amplify Public URL** (e.g., `https://main.<app-id>.amplifyapp.com`).

## 🧪 5. Verification

1. Visit your newly deployed Amplify Frontend URL.
2. Navigate to the **Upload Invoice** tab.
3. Drag and drop a sample PDF invoice and click "Upload & Process".
4. Navigate to the **Dashboard** or **Invoices** tab to watch the invoice move through the Step Functions pipeline from `IN_PROGRESS` to `PROCESSED`.
5. If an anomaly is detected, check your **ReviewerEmail** inbox for an action required email containing Approve/Reject links.

## 🧹 6. Cleanup

To avoid ongoing AWS charges for resources you no longer need, you can delete the stack.

1. First, empty the S3 buckets (Raw and Audit) as CloudFormation cannot delete non-empty buckets:
   ```bash
   cd backend/lambdas/textract-processor
   node wipe_data.mjs
   ```
2. Delete the SAM stack:
   ```bash
   sam delete --stack-name aws-invoice-pipeline
   ```
3. Delete the Amplify App from the AWS Console.
