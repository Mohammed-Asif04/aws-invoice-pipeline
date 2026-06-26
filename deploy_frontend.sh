#!/bin/bash
set -e
cd frontend
rm -f build.zip
cd dist
zip -r ../build.zip .
cd ..
cd ..

APP_ID="d1czdf1c8dm6y8"
BRANCH="main"

echo "Creating deployment..."
OUTPUT=$(aws amplify create-deployment --app-id $APP_ID --branch-name $BRANCH)
JOB_ID=$(echo $OUTPUT | jq -r '.jobId')
UPLOAD_URL=$(echo $OUTPUT | jq -r '.zipUploadUrl')

echo "Uploading build.zip to S3..."
curl -s -X PUT -T frontend/build.zip "$UPLOAD_URL"

echo "Starting deployment..."
aws amplify start-deployment --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID

echo "Deployment started. Job ID: $JOB_ID"
