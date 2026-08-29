import { supabase } from './supabase';

export type StorageBucket = 'avatars' | 'education-files';

const sanitizeSegment = (value: string) => value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const requireClient = () => {
  if (!supabase) throw new Error('قاعدة البيانات غير متاحة.');
  return supabase;
};

const getUserId = async () => {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('يجب تسجيل الدخول أولًا.');
  return data.user.id;
};

export async function uploadUserFile(input: {
  bucket: StorageBucket;
  file: File;
  folder?: string;
  fileName?: string;
}) {
  const client = requireClient();
  if (!(input.file instanceof File)) throw new Error('الملف غير صالح.');
  if (input.file.size <= 0) throw new Error('الملف فارغ.');

  const userId = await getUserId();
  const originalExt = input.file.name.includes('.') ? input.file.name.split('.').pop()?.toLowerCase() : '';
  const base = sanitizeSegment(input.fileName || input.file.name.replace(/\.[^.]+$/, '')) || 'file';
  const ext = originalExt ? `.${sanitizeSegment(originalExt)}` : '';
  const prefix = sanitizeSegment(input.folder || 'files') || 'files';
  const objectPath = `${userId}/${prefix}/${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;

  const { error } = await client.storage.from(input.bucket).upload(objectPath, input.file, {
    contentType: input.file.type || undefined,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data: publicData } = input.bucket === 'avatars'
    ? client.storage.from(input.bucket).getPublicUrl(objectPath)
    : { data: { publicUrl: '' } };

  return {
    bucket: input.bucket,
    path: objectPath,
    name: input.file.name,
    size: input.file.size,
    contentType: input.file.type || 'application/octet-stream',
    publicUrl: publicData?.publicUrl || '',
  };
}

export async function createPrivateDownloadUrl(bucket: StorageBucket, path: string, expiresIn = 3600) {
  const client = requireClient();
  if (bucket !== 'education-files') throw new Error('استخدم getPublicUrl للصور العامة.');
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteUserFile(bucket: StorageBucket, path: string) {
  const client = requireClient();
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function getPublicFileUrl(bucket: StorageBucket, path: string) {
  const client = requireClient();
  if (bucket !== 'avatars') throw new Error('الملف غير عام.');
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
