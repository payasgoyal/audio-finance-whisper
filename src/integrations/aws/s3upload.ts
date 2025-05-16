import { PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, BUCKET_NAME, createS3Client } from './s3client';

/**
 * Generate a unique filename for upload
 * @param extension File extension (e.g. 'wav', 'mp3')
 * @returns A unique filename
 */
export const generateUniqueFilename = (extension: string): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `recording-${timestamp}-${random}.${extension}`;
};

/**
 * Test AWS credentials and bucket existence
 * @param credentials AWS credentials
 * @returns Object with test results and any error messages
 */
export const testAwsConnection = async (
  credentials: { accessKeyId: string; secretAccessKey: string, region?: string }
): Promise<{ success: boolean; message: string; details?: string | unknown }> => {
  try {
    console.log('Testing AWS connection...');
    
    // Create client with provided credentials and region
    const client = createS3Client(
      credentials.accessKeyId, 
      credentials.secretAccessKey,
      credentials.region
    );
    
    // Instead of listing all buckets (which requires additional permissions),
    // directly check if we can access the specific bucket we need
    console.log(`Checking if we can access bucket "${BUCKET_NAME}"...`);
    try {
      // Try to get the bucket location as a simple permission check
      const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      await client.send(command);
      console.log(`Successfully verified access to bucket: ${BUCKET_NAME}`);
    } catch (error) {
      console.error('Error accessing bucket:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.name === 'AccessDenied' || error.message.includes('Access Denied')) {
          return {
            success: false,
            message: 'Access denied to the S3 bucket',
            details: 'Your credentials do not have permission to access this bucket. Please verify your credentials and bucket permissions.'
          };
        } else if (error.name === 'NoSuchBucket' || error.message.includes('NoSuchBucket')) {
          return {
            success: false,
            message: `Bucket "${BUCKET_NAME}" not found`,
            details: `Please verify the bucket exists in region "${client.config.region || 'us-west-2'}".`
          };
        } else if (error.message.includes('ACLs')) {
          // This is actually not a critical error for our test
          console.log('Note: The bucket does not allow ACLs, which is fine for our use case');
          // We'll continue and just not use ACLs
        }
      }
      
      return { 
        success: false, 
        message: 'Cannot access the S3 bucket',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // We've already verified bucket access, so we can proceed
    console.log(`Bucket "${BUCKET_NAME}" is accessible with the provided credentials`);
    
    // Optionally, we could check if we can write to the bucket by creating a test object
    // But we'll skip that for now to avoid creating unnecessary files
    
    return { 
      success: true, 
      message: 'AWS credentials and bucket verified successfully' 
    };
  } catch (error) {
    console.error('Error testing AWS connection:', error);
    return { 
      success: false, 
      message: 'Error testing AWS connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Upload a file to AWS S3 with progress tracking
 * @param file The file blob to upload
 * @param fileName The name to save the file as
 * @param contentType The MIME type of the file
 * @param credentials Optional AWS credentials (if not using environment variables)
 * @param onProgress Optional callback for tracking upload progress (0-100)
 * @returns The public URL of the uploaded file, or null if upload failed
 */
export const uploadToS3WithProgress = async (
  file: Blob | File,
  fileName: string,
  contentType: string,
  credentials?: { accessKeyId: string; secretAccessKey: string; region?: string },
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    console.log('Starting AWS S3 upload process...');
    console.log('File details:', {
      type: file.type,
      size: file.size,
      fileName,
      contentType
    });

    // Use provided credentials or default client
    const client = credentials 
      ? createS3Client(
          credentials.accessKeyId, 
          credentials.secretAccessKey, 
          credentials.region
        )
      : s3Client;

    // Convert Blob to ArrayBuffer for S3 upload
    console.log('Converting blob to ArrayBuffer');
    const arrayBuffer = await file.arrayBuffer();

    // Create upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType,
      CacheControl: 'max-age=3600',
      // Removed ACL parameter as the bucket doesn't allow ACLs
    };
    console.log('Upload parameters prepared:', { ...params, Body: '[binary data]' });

    // Use multipart upload for better handling of large files
    console.log('Creating Upload instance');
    const upload = new Upload({
      client,
      params,
    });

    // Add progress tracking if callback provided
    if (onProgress) {
      console.log('Setting up progress tracking');
      upload.on('httpUploadProgress', (progress) => {
        console.log('Upload progress event:', progress);
        if (progress.loaded && progress.total) {
          const percentLoaded = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Upload progress: ${percentLoaded}%`);
          onProgress(percentLoaded);
        }
      });
    }

    // Execute the upload
    console.log('Starting upload execution');
    await upload.done();
    console.log('Upload completed successfully');

    // Generate the URL in the requested S3 URI format
    // This is the format that will be sent to the webhook
    const publicUrl = `s3://${BUCKET_NAME}/${fileName}`;
    console.log('Generated S3 URI:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file to AWS S3:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for common AWS errors
      if (error.name === 'AccessDenied' || error.message.includes('Access Denied')) {
        console.error('ACCESS DENIED: Check your AWS credentials and bucket permissions');
      } else if (error.name === 'NoSuchBucket' || error.message.includes('NoSuchBucket')) {
        console.error(`BUCKET NOT FOUND: The bucket "${BUCKET_NAME}" does not exist in the configured region`);
      } else if (error.message.includes('NetworkError') || error.message.includes('Network Error')) {
        console.error('NETWORK ERROR: Check your internet connection');
      } else if (error.message.includes('CORS')) {
        console.error('CORS ERROR: S3 bucket needs CORS configuration to allow uploads from your domain');
      }
    }
    return null;
  }
}; 