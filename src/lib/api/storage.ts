import { supabase } from '@/lib/supabase';

function extensionFromUri(uri: string): string {
  const match = /\.(\w+)(?:\?.*)?$/.exec(uri);
  return match ? match[1] : 'jpg';
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/** Uploads to listing-images/{userId}/{listingId}/{filename}, returns the public URL. */
export async function uploadListingImage(
  localUri: string,
  userId: string,
  listingId: string,
): Promise<string> {
  const blob = await uriToBlob(localUri);
  const path = `${userId}/${listingId}/${Date.now()}.${extensionFromUri(localUri)}`;

  const { error } = await supabase.storage.from('listing-images').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
}

export async function deleteListingImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from('listing-images').remove([path]);
  if (error) throw new Error(error.message);
}

/** Uploads to verification-docs/{userId}/{docType}-{timestamp}.ext (private bucket), returns the storage path. */
export async function uploadVerificationDoc(
  localUri: string,
  userId: string,
  docType: string,
): Promise<string> {
  const blob = await uriToBlob(localUri);
  const path = `${userId}/${docType}-${Date.now()}.${extensionFromUri(localUri)}`;

  const { error } = await supabase.storage.from('verification-docs').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  if (error) throw new Error(error.message);

  return path;
}

export async function getVerificationDocSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('verification-docs')
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
