import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// AWS S3 Configuration
export const S3_CONFIG = {
  region: 'us-west-2', // Default region
};

// Bucket name
export const BUCKET_NAME = 'personal-finance-audio-files';

// AWS credentials from environment variables
const AWS_CREDENTIALS = {
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
};

// Log configuration for debugging
console.log('Initializing AWS S3 client with config:', {
  region: S3_CONFIG.region,
  bucket: BUCKET_NAME,
  hasCredentials: !!AWS_CREDENTIALS.accessKeyId && !!AWS_CREDENTIALS.secretAccessKey,
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

// Default client with environment variable credentials
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CREDENTIALS.accessKeyId,
    secretAccessKey: AWS_CREDENTIALS.secretAccessKey,
  },
}); 