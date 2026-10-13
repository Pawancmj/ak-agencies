import { describe, it, expect, afterEach } from 'vitest';
import {
  ALLOWED_EXTENSIONS,
  IMAGE_MAX_BYTES_DEFAULT,
  VIDEO_MAX_BYTES_DEFAULT,
  getExtension,
  getImageMaxBytes,
  getMaxBytesFor,
  getVideoMaxBytes,
  sanitizeFileName,
  sniffMimeType,
  validateUpload,
} from '@/lib/image-storage';

function padded(signature: number[], length = 64): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes.set(signature, 0);
  return bytes;
}

function ftypFile(brand: string, compatible?: string): Uint8Array {
  const bytes = new Uint8Array(64);
  bytes.set([0, 0, 0, 0x20], 0);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4);
  for (let i = 0; i < 4; i += 1) bytes[8 + i] = brand.charCodeAt(i);
  if (compatible) {
    for (let i = 0; i < 4; i += 1) bytes[12 + i] = compatible.charCodeAt(i);
  }
  return bytes;
}

const PNG_BYTES = padded([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 32);
const SVG_BYTES = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
);

afterEach(() => {
  delete process.env.UPLOAD_MAX_IMAGE_BYTES;
  delete process.env.UPLOAD_MAX_VIDEO_BYTES;
});

describe('sniffMimeType', () => {
  it('detects JPEG', () => {
    expect(sniffMimeType(padded([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    expect(sniffMimeType(PNG_BYTES)).toBe('image/png');
  });

  it('detects GIF', () => {
    expect(
      sniffMimeType(padded([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])),
    ).toBe('image/gif');
  });

  it('detects WebP', () => {
    const bytes = new Uint8Array(32);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(sniffMimeType(bytes)).toBe('image/webp');
  });

  it('detects AVIF from the major brand', () => {
    expect(sniffMimeType(ftypFile('avif'))).toBe('image/avif');
  });

  it('detects AVIF from a compatible brand when major brand is mif1', () => {
    expect(sniffMimeType(ftypFile('mif1', 'avif'))).toBe('image/avif');
  });

  it('detects MP4', () => {
    expect(sniffMimeType(ftypFile('isom'))).toBe('video/mp4');
    expect(sniffMimeType(ftypFile('mp42'))).toBe('video/mp4');
  });

  it('detects WebM / Matroska', () => {
    expect(sniffMimeType(padded([0x1a, 0x45, 0xdf, 0xa3]))).toBe('video/webm');
  });

  it('rejects markup, scripts and unknown bytes', () => {
    expect(sniffMimeType(SVG_BYTES)).toBeNull();
    expect(sniffMimeType(new TextEncoder().encode('<html>x</html>'))).toBeNull();
    expect(sniffMimeType(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull();
    expect(sniffMimeType(new Uint8Array(0))).toBeNull();
  });
});

describe('validateUpload', () => {
  it('accepts a valid PNG and reports the sniffed type', () => {
    const result = validateUpload('cushion cover.png', PNG_BYTES);
    expect(result).toEqual({
      ok: true,
      mimeType: 'image/png',
      fileName: 'cushion cover.png',
      size: PNG_BYTES.length,
    });
  });

  it('accepts uppercase extensions', () => {
    const result = validateUpload('PHOTO.PNG', PNG_BYTES);
    expect(result.ok).toBe(true);
  });

  it('rejects an empty file', () => {
    const result = validateUpload('empty.png', new Uint8Array(0));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Empty file/);
  });

  it('rejects unsupported extensions', () => {
    for (const name of ['evil.svg', 'page.html', 'script.exe', 'photo']) {
      const result = validateUpload(name, PNG_BYTES);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/Unsupported file extension/);
    }
  });

  it('rejects markup disguised with an allowed extension', () => {
    const result = validateUpload('not-really.png', SVG_BYTES);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported file content/);
  });

  it('rejects oversize images using the configured limit', () => {
    process.env.UPLOAD_MAX_IMAGE_BYTES = '16';
    const result = validateUpload('photo.png', PNG_BYTES);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/File too large/);
  });

  it('strips path traversal from stored file names', () => {
    const result = validateUpload('../../etc/passwd.png', PNG_BYTES);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileName).toBe('passwd.png');
      expect(result.fileName).not.toContain('..');
      expect(result.fileName).not.toContain('/');
      expect(result.fileName).not.toContain('\\');
    }
  });

  it('rejects a name that has no extension at all', () => {
    const result = validateUpload('///', PNG_BYTES);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported file extension/);
  });

  it('limits stored file name length', () => {
    const longName = `${'a'.repeat(400)}.png`;
    const result = validateUpload(longName, PNG_BYTES);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.fileName.length).toBeLessThanOrEqual(100);
  });
});

describe('size limits', () => {
  it('exposes documented defaults', () => {
    expect(IMAGE_MAX_BYTES_DEFAULT).toBe(5 * 1024 * 1024);
    expect(VIDEO_MAX_BYTES_DEFAULT).toBe(50 * 1024 * 1024);
  });

  it('honours environment overrides', () => {
    process.env.UPLOAD_MAX_IMAGE_BYTES = '1024';
    process.env.UPLOAD_MAX_VIDEO_BYTES = '2048';
    expect(getImageMaxBytes()).toBe(1024);
    expect(getVideoMaxBytes()).toBe(2048);
  });

  it('ignores invalid environment values', () => {
    process.env.UPLOAD_MAX_IMAGE_BYTES = 'not-a-number';
    process.env.UPLOAD_MAX_VIDEO_BYTES = '-5';
    expect(getImageMaxBytes()).toBe(IMAGE_MAX_BYTES_DEFAULT);
    expect(getVideoMaxBytes()).toBe(VIDEO_MAX_BYTES_DEFAULT);
  });

  it('picks the limit matching the content type', () => {
    process.env.UPLOAD_MAX_IMAGE_BYTES = '1024';
    process.env.UPLOAD_MAX_VIDEO_BYTES = '2048';
    expect(getMaxBytesFor('image/png')).toBe(1024);
    expect(getMaxBytesFor('video/mp4')).toBe(2048);
  });
});

describe('file name helpers', () => {
  it('extracts extensions case-insensitively', () => {
    expect(getExtension('a/b/photo.JPG')).toBe('jpg');
    expect(getExtension('archive.tar.gz')).toBe('gz');
    expect(getExtension('noextension')).toBe('');
    expect(getExtension('.hidden')).toBe('');
    expect(getExtension('trailing.')).toBe('');
  });

  it('sanitises hostile characters', () => {
    expect(sanitizeFileName('my <file> (1).png')).toBe('my _file_ _1_.png');
    expect(sanitizeFileName('')).toBe('upload');
    expect(sanitizeFileName('   ')).toBe('upload');
  });

  it('publishes only supported types', () => {
    expect(ALLOWED_EXTENSIONS).not.toContain('svg');
    expect(ALLOWED_EXTENSIONS).not.toContain('html');
    expect(ALLOWED_EXTENSIONS).toContain('avif');
  });
});
