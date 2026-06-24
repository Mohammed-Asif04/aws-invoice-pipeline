# 🚀 Deployment Guide — AWS Invoice Pipeline

This guide outlines the step-by-step instructions to deploy the event-driven invoice processing pipeline and React dashboard in your own AWS account.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
* **Node.js 18+** & **pnpm** (installed globally)
* **AWS CLI v2** configured with your IAM credentials
* **AWS SAM CLI** (Serverless Application Model)
* **make** (utility for running build scripts)

---

## 🛠️ Step 1: AWS Console Preparations

Before launching the deployment pipeline, you must manually set up SES verification and Bedrock access in the AWS Console.

### 1. Verify SES Email Identities
SES requires verification before sending emails to or from an address (especially in sandbox mode).
1. Navigate to the **Amazon SES Console** → **Verified identities**.
2. Click **Create identity** and select **Email address**.
3. Enter your email (e.g., `mohad.asif0407@gmail.com`).
4. Click **Create identity**.
5. Check your inbox and click the **AWS Verification Link** inside the email.
6. If your account is in Sandbox mode, repeat these steps to verify the *recipient* email address if it is different from the sender.

### 2. Enable Amazon Bedrock Model Access
By default, model access to Anthropic Claude is not enabled.
1. Navigate to the **Amazon Bedrock Console**.
2. Select your deployment region (e.g., **Mumbai `ap-south-1`** or **N. Virginia `us-east-1`**).
3. In the left navigation pane, scroll to the bottom and click **Model access**.
4. Click **Manage model access** (top-right).
5. Check the box next to **Anthropic** → **Claude 3 Sonnet** and **Claude 3 Haiku**.
6. Click **Save changes** (access is usually granted within 5 minutes).

---

## 💻 Step 2: Local Environment Setup

Configure your environment variables before deployment:

1. Copy the example `.env` file at the root:
   ```bash
   cp .env.example .env
   ```
2. Fill in the keys following the instructions in [env_setup_guide.md](file:///home/morpheus04/.gemini/antigravity-ide/brain/24341ac3-770e-42d5-9c26-131d12981961/env_setup_guide.md). Ensure the following are set:
   * `AWS_ACCOUNT_ID`: Your 12-digit account number.
   * `SES_SENDER_EMAIL` & `REVIEWER_EMAIL`: The emails verified in Step 1.
   * `AWS_REGION`: Set to `ap-south-1` (or your preferred region).

---

## 🚀 Step 3: Compile and Deploy Infrastructure

The root `Makefile` automates the entire process:

1. **Install Dependencies**:
   ```bash
   make install
   ```
   This downloads and builds dependencies for all Lambda modules and the frontend.

2. **Build the SAM Template**:
   ```bash
   make build
   ```
   This compiles TypeScript files and bundles Lambda functions via esbuild.

3. **Deploy stack to AWS (First Time)**:
   ```bash
   make deploy-guided
   ```
   Provide the following parameters when prompted by the SAM CLI:
   * **Stack Name**: `aws-invoice-pipeline`
   * **AWS Region**: `ap-south-1` (or matching your `.env`)
   * **Parameter SenderEmail**: Your verified SES email
   * **Parameter ReviewerEmail**: Your verified reviewer email
   * **Confirm changes before deploy**: `Yes`
   * **Allow SAM CLI IAM role creation**: `Yes`
   * **Save arguments to configuration file**: `Yes` (updates `samconfig.toml`)

4. **Verify Outputs**:
   After successful deployment, copy the outputs from the terminal:
   * `ApiEndpoint`: The API Gateway REST URL (e.g., `https://xxxx.execute-api.ap-south-1.amazonaws.com/prod`).
   * `StateMachineArn`: Step Functions workflow ARN.

5. Update your root `.env` and [frontend/.env](file:///home/morpheus04/Desktop/aws-invoice-pipeline/frontend/.env) with the `ApiEndpoint` value:
   ```env
   # In frontend/.env
   VITE_API_BASE_URL=https://xxxx.execute-api.ap-south-1.amazonaws.com/prod
   ```

---

## 💻 Step 4: Host React Frontend (AWS Amplify)

Use the AWS Amplify Console to host the React UI dashboard with auto-deployments linked to Git:

1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Navigate to the **AWS Amplify Console**.
3. Click **Create new app** → **Host web app**.
4. Authorize your Git provider and select the repository/branch (`main`).
5. Amplify will auto-detect the build specifications inside [amplify.yml](file:///home/morpheus04/Desktop/aws-invoice-pipeline/frontend/amplify.yml) which we configured at the root.
6. In **Advanced Settings**, add the environment variables:
   * Set `VITE_API_BASE_URL` to your CloudFormation `ApiEndpoint` URL.
   * Set `VITE_AWS_REGION` to your AWS region code.
7. Click **Save and deploy**. Amplify will provision, build, and host the dashboard on a public `amplifyapp.com` subdomain!
