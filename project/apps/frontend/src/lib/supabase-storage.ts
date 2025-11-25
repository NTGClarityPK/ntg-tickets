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
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated. Please sign in to upload files.');
    }

    // Upload file
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      throw new Error(error.message || 'Failed to upload file');
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error uploading file:', error);
    throw error;
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
  // Supabase doesn't support progress tracking directly
  // We'll simulate it for better UX
  if (onProgress) {
    onProgress(0);
    setTimeout(() => onProgress(50), 100);
    setTimeout(() => onProgress(90), 200);
  }

  const url = await uploadFile(file, options);

  if (onProgress) {
    onProgress(100);
  }

  return url;
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

