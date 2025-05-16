import { PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, BUCKET_NAME } from './client';

/**
 * Check if the bucket exists
 * @returns Promise resolving to true if bucket exists, false otherwise
 */
export const checkBucketExists = async (): Promise<boolean> => {
  try {
    console.log(`Checking if bucket '${BUCKET_NAME}' exists...`);
    const response = await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log('Bucket check response:', response);
    return true;
  } catch (error) {
    console.error('Error checking bucket existence:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Try to determine if it's an authentication issue
      if (error.message.includes('AccessDenied') || error.message.includes('403')) {
        console.error('This appears to be an authentication issue. Please verify your credentials.');
      } else if (error.message.includes('NoSuchBucket') || error.message.includes('404')) {
        console.error(`The bucket '${BUCKET_NAME}' does not exist. Please create it first.`);
      }
    }
    
    return false;
  }
};

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
 * Upload a file to Supabase storage using S3 protocol
 * @param file The file blob to upload
 * @param fileName The name to save the file as
 * @param contentType The MIME type of the file
 * @returns The public URL of the uploaded file, or null if upload failed
 */
export const uploadFileS3 = async (
  file: Blob | File,
  fileName: string,
  contentType: string
): Promise<string | null> => {
  try {
    // Check if bucket exists
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      throw new Error(`Bucket ${BUCKET_NAME} does not exist`);
    }

    // Convert Blob to ArrayBuffer for S3 upload
    const arrayBuffer = await file.arrayBuffer();

    // Create upload parameters with authenticated access
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType,
      CacheControl: 'max-age=3600',
      ACL: 'public-read' as const, // Ensure the uploaded file is publicly accessible
    };

    // Use multipart upload for better handling of large files
    const upload = new Upload({
      client: s3Client,
      params,
    });

    // Execute the upload
    await upload.done();

    // Generate the public URL
    // Supabase public URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[filename]
    const supabaseProjectRef = 'jkkbfhffefwozwlphhvt';
    const publicUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file using S3:', error);
    return null;
  }
};

/**
 * Upload a file to Supabase storage using S3 protocol with progress tracking
 * @param file The file blob to upload
 * @param fileName The name to save the file as
 * @param contentType The MIME type of the file
 * @param onProgress Optional callback for tracking upload progress (0-100)
 * @returns The public URL of the uploaded file, or null if upload failed
 */
export const uploadFileWithProgress = async (
  file: Blob | File,
  fileName: string,
  contentType: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    console.log('Starting S3 upload process...');
    console.log('File details:', {
      type: file.type,
      size: file.size,
      fileName,
      contentType
    });

    // Check if bucket exists
    console.log('Checking if bucket exists:', BUCKET_NAME);
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      console.error(`Bucket ${BUCKET_NAME} does not exist or cannot be accessed`);
      throw new Error(`Bucket ${BUCKET_NAME} does not exist`);
    }
    console.log('Bucket exists, proceeding with upload');

    // Convert Blob to ArrayBuffer for S3 upload
    console.log('Converting blob to ArrayBuffer');
    const arrayBuffer = await file.arrayBuffer();

    // Create upload parameters with authenticated access
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType,
      CacheControl: 'max-age=3600',
      // Try without ACL first as it might be causing issues
      // ACL: 'public-read' as const,
    };
    console.log('Upload parameters prepared:', { ...params, Body: '[binary data]' });

    // Use multipart upload for better handling of large files
    console.log('Creating Upload instance');
    const upload = new Upload({
      client: s3Client,
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

    // Generate the public URL
    const supabaseProjectRef = 'jkkbfhffefwozwlphhvt';
    const publicUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
    console.log('Generated public URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file using S3:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}; 