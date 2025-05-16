import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// AWS S3 Configuration
// Replace these with your actual AWS credentials
export const S3_CONFIG = {
  region: 'us-west-2', // Replace with your bucket's region
  // No endpoint needed for direct AWS S3 access (unlike Supabase)
};

// Bucket name
export const BUCKET_NAME = 'personal-finance-audio-files';

// Log configuration for debugging
console.log('Initializing AWS S3 client with config:', {
  region: S3_CONFIG.region,
  bucket: BUCKET_NAME,
  // Credentials will be provided separately
});

// Create S3 client instance
// Note: You'll need to provide your AWS credentials
export const createS3Client = (accessKeyId: string, secretAccessKey: string, region?: string) => {
  return new S3Client({
    region: region || S3_CONFIG.region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Default client with environment variables (if available)
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
  // If you have AWS credentials in environment variables, they'll be used automatically
  // Otherwise, you'll need to provide them when uploading
}); 