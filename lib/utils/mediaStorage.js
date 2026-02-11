import { randomUUID } from 'crypto';

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Save a media buffer to Supabase Storage and insert a trip_photos record.
 * Returns { storagePath, photoId, url }.
 */
export async function saveMediaToStorage(supabase, { tripId, buffer, mimeType, channel, sourceMessageId, memberId }) {
  const ext = MIME_TO_EXT[mimeType] || 'jpg';
  const fileId = randomUUID();
  const storagePath = `${tripId}/${fileId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('trip-photos')
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Failed to upload photo to storage:', uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(storagePath);

  const storageUrl = urlData?.publicUrl || null;

  const { data: photo, error: insertError } = await supabase
    .from('trip_photos')
    .insert({
      trip_id: tripId,
      storage_path: storagePath,
      storage_url: storageUrl,
      mime_type: mimeType,
      source_channel: channel,
      source_message_id: sourceMessageId || null,
      uploaded_by_member_id: memberId || null,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to insert trip_photos record:', insertError);
    return null;
  }

  return { storagePath, photoId: photo.id, url: storageUrl };
}
