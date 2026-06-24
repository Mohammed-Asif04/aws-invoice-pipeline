import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@aws-sdk/client-s3': path.resolve(__dirname, 'node_modules/@aws-sdk/client-s3'),
      '@aws-sdk/client-textract': path.resolve(__dirname, 'node_modules/@aws-sdk/client-textract'),
      '@aws-sdk/client-bedrock-runtime': path.resolve(__dirname, 'node_modules/@aws-sdk/client-bedrock-runtime'),
      '@aws-sdk/client-sfn': path.resolve(__dirname, 'node_modules/@aws-sdk/client-sfn'),
      '@aws-sdk/client-ses': path.resolve(__dirname, 'node_modules/@aws-sdk/client-ses'),
      '@aws-sdk/client-sns': path.resolve(__dirname, 'node_modules/@aws-sdk/client-sns'),
      '@aws-sdk/client-dynamodb': path.resolve(__dirname, 'node_modules/@aws-sdk/client-dynamodb'),
      '@aws-sdk/lib-dynamodb': path.resolve(__dirname, 'node_modules/@aws-sdk/lib-dynamodb'),
      'uuid': path.resolve(__dirname, 'node_modules/uuid'),
    },
  },
});
