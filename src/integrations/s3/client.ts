import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// S3 Connection Details from Supabase
export const S3_CONFIG = {
  endpoint: 'https://jkkbfhffefwozwlphhvt.supabase.co/storage/v1/s3',
  region: 'us-west-2',
  forcePathStyle: true, // Required for Supabase S3 compatibility
};

// Bucket name
export const BUCKET_NAME = 'personal-finance-audio-files';

// Log configuration for debugging
console.log('Initializing S3 client with config:', {
  endpoint: S3_CONFIG.endpoint,
  region: S3_CONFIG.region,
  forcePathStyle: S3_CONFIG.forcePathStyle,
  credentials: {
    accessKeyId: '1a471a5a25b89c857b38aa945510b003',
    secretAccessKey: '[REDACTED]',
  },
});

// Create S3 client instance
export const s3Client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: S3_CONFIG.region,
  forcePathStyle: S3_CONFIG.forcePathStyle,
  credentials: {
    accessKeyId: '1a471a5a25b89c857b38aa945510b003',
    secretAccessKey: 'e8bf88d4784a4b0adf9a569e2e37eb0ffcc343a98bba757c91a7217d0a277f6c',
  },
}); 