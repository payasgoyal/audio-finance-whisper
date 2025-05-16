import { supabase } from './client';

const BUCKET_NAME = 'personal-finance-audio-files';

/**
 * Ensures that the storage bucket exists
 * @returns True if the bucket exists or was created, false otherwise
 */
export const ensureBucketExists = async (): Promise<boolean> => {
  try {
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    console.log(buckets);
    
    if (listError) throw listError;
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    // If the bucket doesn't exist, create it
    if (!bucketExists) {
      const { error: createError } = await supabase
        .storage
        .createBucket(BUCKET_NAME, {
          public: true, // Make the bucket publicly accessible
          fileSizeLimit: 52428800, // 50MB limit
        });
      
      if (createError) throw createError;
      console.log(`Created storage bucket: ${BUCKET_NAME}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

/**
 * Uploads a file to the Supabase storage bucket
 * @param file The file blob to upload
 * @param fileName The name to save the file as
 * @param contentType The MIME type of the file
 * @returns The public URL of the uploaded file, or null if upload failed
 */
export const uploadFile = async (
  file: Blob,
  fileName: string,
  contentType: string
): Promise<string | null> => {
  try {
    // First ensure the bucket exists
    const bucketExists = await ensureBucketExists();
    if (!bucketExists) {
      throw new Error('Storage bucket does not exist and could not be created');
    }
    
    // Upload the file
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType,
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files with the same name
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
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