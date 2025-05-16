import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// AWS S3 Configuration
export const S3_CONFIG = {
  region: 'us-west-2', // Default region
};

// Bucket name
export const BUCKET_NAME = 'personal-finance-audio-files';

// Hardcoded AWS credentials (for learning purposes only)
const AWS_CREDENTIALS = {
  accessKeyId: 'AKIAWH2QMV5DRJRFD255',
  secretAccessKey: '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',
};

// Log configuration for debugging
console.log('Initializing AWS S3 client with config:', {
  region: S3_CONFIG.region,
  bucket: BUCKET_NAME,
  hasCredentials: true, // We now have hardcoded credentials
});

// Create S3 client instance with custom credentials
export const createS3Client = (accessKeyId: string, secretAccessKey: string, region?: string) => {
  return new S3Client({
    region: region || S3_CONFIG.region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Default client with hardcoded credentials
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CREDENTIALS.accessKeyId,
    secretAccessKey: AWS_CREDENTIALS.secretAccessKey,
  },
}); 