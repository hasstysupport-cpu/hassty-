/**
 * Hassty Avatar & Profile Image Helper
 * Provides universal fallback avatars and fast client-side image optimization.
 */

// Universal fallback SVG avatar (Neutral modern silhouette in platform blue)
export const DEFAULT_USER_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect width="128" height="128" fill="#EFF6FF" rx="28"/>
  <circle cx="64" cy="48" r="24" fill="#3B82F6"/>
  <path d="M24 112c0-22 18-36 40-36s40 14 40 36" fill="#2563EB"/>
  <circle cx="64" cy="48" r="20" fill="#60A5FA"/>
</svg>
`)}`;

export const DEFAULT_TEACHER_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect width="128" height="128" fill="#ECFDF5" rx="28"/>
  <circle cx="64" cy="48" r="24" fill="#10B981"/>
  <path d="M24 112c0-22 18-36 40-36s40 14 40 36" fill="#059669"/>
  <circle cx="64" cy="48" r="20" fill="#34D399"/>
</svg>
`)}`;

export const DEFAULT_PARENT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect width="128" height="128" fill="#FFFBEB" rx="28"/>
  <circle cx="64" cy="48" r="24" fill="#F59E0B"/>
  <path d="M24 112c0-22 18-36 40-36s40 14 40 36" fill="#D97706"/>
  <circle cx="64" cy="48" r="20" fill="#FBBF24"/>
</svg>
`)}`;

/**
 * Returns a guaranteed valid avatar URL
 */
export function getCleanAvatarUrl(avatarUrl?: string | null, role: string = 'student', name: string = ''): string {
  if (avatarUrl && avatarUrl.trim().length > 10 && !avatarUrl.includes('placeholder.com') && !avatarUrl.includes('example.com')) {
    return avatarUrl;
  }

  if (role === 'teacher') return DEFAULT_TEACHER_AVATAR;
  if (role === 'parent') return DEFAULT_PARENT_AVATAR;
  return DEFAULT_USER_AVATAR;
}

/**
 * Optimizes an uploaded image file into a compressed Base64 Data URL (e.g. 400x400 JPEG)
 * Suitable for instant display, offline storage, and direct saving in Supabase.
 */
export async function optimizeProfileImage(file: File, maxSize: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المرفوع ليس صورة صالحة'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio or crop square
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG 85%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('فشل قراءة الصورة'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('فشل رفع الملف'));
    reader.readAsDataURL(file);
  });
}
