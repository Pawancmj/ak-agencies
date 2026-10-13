import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    uploadedFile: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/img/[id]/route';

const db = prisma.uploadedFile as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
};

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03, 0x04,
]);

const request = new Request(
  'http://localhost/api/img/x',
) as unknown as NextRequest;

function get(id: string) {
  return GET(request, { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/img/[id]', () => {
  it('returns the raw bytes with the stored MIME type', async () => {
    db.findUnique.mockResolvedValue({
      data: PNG_BYTES,
      mimeType: 'image/png',
    });

    const res = await get('cmtestuploaded0001');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Length')).toBe(
      String(PNG_BYTES.length),
    );

    const body = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(body)).toEqual(Array.from(PNG_BYTES));
  });

  it('requests only the fields it needs', async () => {
    db.findUnique.mockResolvedValue({
      data: PNG_BYTES,
      mimeType: 'image/png',
    });

    await get('cmtestuploaded0001');

    expect(db.findUnique).toHaveBeenCalledWith({
      where: { id: 'cmtestuploaded0001' },
      select: { data: true, mimeType: true },
    });
  });

  it('sets hardening and caching headers', async () => {
    db.findUnique.mockResolvedValue({
      data: PNG_BYTES,
      mimeType: 'image/webp',
    });

    const res = await get('cmtestuploaded0001');

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Content-Disposition')).toBe('inline');
    expect(res.headers.get('Cache-Control')).toContain('public');
    expect(res.headers.get('Cache-Control')).toContain('max-age=');
    expect(res.headers.get('Content-Type')).toBe('image/webp');
  });

  it('returns 404 for a missing image', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await get('cmmissing0000000001');

    expect(res.status).toBe(404);
    expect((await res.arrayBuffer()).byteLength).toBe(0);
  });

  it('rejects malformed ids without touching the database', async () => {
    for (const id of [
      '../../etc/passwd',
      'a b',
      'img;DROP TABLE products',
      'x'.repeat(65),
      '',
      '%2e%2e%2fetc',
    ]) {
      const res = await get(id);
      expect(res.status).toBe(404);
    }

    expect(db.findUnique).not.toHaveBeenCalled();
  });

  it('does not expose database errors to the client', async () => {
    db.findUnique.mockRejectedValue(
      new Error('password=hunter2 relation uploaded_files'),
    );

    const res = await get('cmtestuploaded0001');

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('');
    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('SELECT');
    expect(res.headers.get('Content-Type')).toBeNull();
  });
});
