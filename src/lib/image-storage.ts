export const IMAGE_MAX_BYTES_DEFAULT = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES_DEFAULT = 50 * 1024 * 1024;

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MP4_BRANDS = new Set([
  'isom',
  'iso2',
  'iso4',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'mp71',
  'avc1',
  'dash',
]);

export const ALLOWED_EXTENSIONS = Object.keys(EXTENSION_TO_MIME);
export const ALLOWED_MIME_TYPES = Array.from(
  new Set(Object.values(EXTENSION_TO_MIME)),
);
export const ALLOWED_IMAGE_MIME_TYPES = Array.from(IMAGE_MIME_TYPES);

function envByteLimit(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function getImageMaxBytes(): number {
  return envByteLimit('UPLOAD_MAX_IMAGE_BYTES', IMAGE_MAX_BYTES_DEFAULT);
}

export function getVideoMaxBytes(): number {
  return envByteLimit('UPLOAD_MAX_VIDEO_BYTES', VIDEO_MAX_BYTES_DEFAULT);
}

export function isImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType);
}

export function getMaxBytesFor(mimeType: string): number {
  return isImageMimeType(mimeType) ? getImageMaxBytes() : getVideoMaxBytes();
}

export function getExtension(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function sanitizeFileName(fileName: string): string {
  const base = (fileName.split(/[\\/]/).pop() ?? '').trim();
  const cleaned = base.replace(/[^\w.\- ]+/g, '_').slice(0, 100).trim();
  return cleaned || 'upload';
}

function matches(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return '';
  let out = '';
  for (let i = offset; i < offset + length; i += 1) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

export function sniffMimeType(bytes: Uint8Array): string | null {
  if (matches(bytes, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (matches(bytes, 0, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (
    matches(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matches(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return 'image/webp';
  }
  if (matches(bytes, 0, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm';
  if (matches(bytes, 4, [0x66, 0x74, 0x79, 0x70]) && bytes.length >= 12) {
    const boxSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    const end = Math.min(
      bytes.length,
      boxSize >= 8 && boxSize <= 1024 ? boxSize : 32,
    );
    const brands: string[] = [];
    for (let offset = 8; offset + 4 <= end; offset += 4) {
      brands.push(ascii(bytes, offset, 4));
    }
    if (brands.some((brand) => brand === 'avif' || brand === 'avis')) {
      return 'image/avif';
    }
    if (brands.some((brand) => MP4_BRANDS.has(brand) || brand.startsWith('mp4'))) {
      return 'video/mp4';
    }
  }
  return null;
}

export type UploadCheck =
  | { ok: true; mimeType: string; fileName: string; size: number }
  | { ok: false; error: string };

export function validateUpload(fileName: string, bytes: Uint8Array): UploadCheck {
  if (bytes.length === 0) {
    return { ok: false, error: 'Empty file' };
  }

  const extension = getExtension(fileName);
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      ok: false,
      error: `Unsupported file extension "${extension ? `.${extension}` : ''}". Allowed: ${ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(', ')}`,
    };
  }

  const mimeType = sniffMimeType(bytes);
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      ok: false,
      error: `Unsupported file content. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.map((t) => t.replace('image/', '').toUpperCase()).join(', ')}, MP4, WebM`,
    };
  }

  const maxBytes = getMaxBytesFor(mimeType);
  if (bytes.length > maxBytes) {
    return {
      ok: false,
      error: `File too large (${formatMegabytes(bytes.length)}). Maximum size: ${formatMegabytes(maxBytes)}`,
    };
  }

  return { ok: true, mimeType, fileName: sanitizeFileName(fileName), size: bytes.length };
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
