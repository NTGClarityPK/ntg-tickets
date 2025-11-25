import { supabase } from './supabase';

/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage
 */

const ATTACHMENTS_BUCKET = 'ticket-attachments';
export const AVATARS_BUCKET = 'user-avatars'; // Export for use in avatar uploads

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const bucket = options.bucket || ATTACHMENTS_BUCKET;
    const folder = options.folder || 'uploads';
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${timestamp}_${sanitizedFilename}`;

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('Not authenticated. Please sign in to upload files.');
    }

    // Upload file with error handling
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      // Provide more specific error messages
      if (uploadError.message.includes('duplicate') || uploadError.message.includes('already exists')) {
        throw new Error('A file with this name already exists. Please rename the file and try again.');
      } else if (uploadError.message.includes('size') || uploadError.message.includes('too large')) {
        throw new Error('File is too large. Please select a smaller file.');
      } else if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
        throw new Error('Permission denied. You may not have access to upload files.');
      } else {
        throw new Error(uploadError.message || 'Failed to upload file. Please check your connection and try again.');
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to get file URL after upload.');
    }

    return publicUrl;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error uploading file:', error);
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during file upload.');
  }
}

/**
 * Upload file with progress tracking
 */
export async function uploadFileWithProgress(
  file: File,
  options: UploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<string> {
  // Calculate timeout based on file size
  // Minimum 3 minutes, add 30 seconds per MB, cap at 10 minutes
  const fileSizeMB = file.size / (1024 * 1024);
  const baseTimeout = 180000; // 3 minutes base
  const sizeTimeout = fileSizeMB * 30000; // 30 seconds per MB
  const timeoutMs = Math.max(baseTimeout, baseTimeout + sizeTimeout);
  const maxTimeout = 600000; // Cap at 10 minutes
  const finalTimeout = Math.min(timeoutMs, maxTimeout);

  // Create a timeout promise that rejects after calculated time
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Upload timeout: The upload took longer than ${Math.round(finalTimeout / 1000)} seconds. This may be due to a slow connection or large file size. Please try again or use a smaller file.`));
    }, finalTimeout);
  });

  // Supabase doesn't support progress tracking directly
  // We'll simulate it for better UX with more realistic timing
  if (onProgress) {
    onProgress(0);
    // Simulate progress more gradually based on file size
    const progressInterval = Math.min(2000, finalTimeout / 4); // Update progress 4 times
    setTimeout(() => onProgress(25), progressInterval);
    setTimeout(() => onProgress(50), progressInterval * 2);
    setTimeout(() => onProgress(75), progressInterval * 3);
  }

  // Race between upload and timeout
  const uploadPromise = uploadFile(file, options).then(url => {
    if (timeoutId) clearTimeout(timeoutId);
    if (onProgress) {
      onProgress(100);
    }
    return url;
  }).catch(error => {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  });

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  filePath: string,
  bucket: string = ATTACHMENTS_BUCKET
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    // Extract path from URL if full URL is provided
    let path = filePath;
    if (filePath.includes('/storage/v1/object/public/')) {
      const urlParts = filePath.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const bucketAndPath = urlParts[1];
        const pathParts = bucketAndPath.split('/');
        path = pathParts.slice(1).join('/');
      }
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(error.message || 'Failed to delete file');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get a signed URL for a file (for private files)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600,
  bucket: string = ATTACHMENTS_BUCKET
): Promise<string> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    // Extract path from URL if full URL is provided
    let path = filePath;
    if (filePath.includes('/storage/v1/object/public/')) {
      const urlParts = filePath.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const bucketAndPath = urlParts[1];
        const pathParts = bucketAndPath.split('/');
        path = pathParts.slice(1).join('/');
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(error.message || 'Failed to generate signed URL');
    }

    return data.signedUrl;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(
  filePath: string,
  bucket: string = ATTACHMENTS_BUCKET
): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

