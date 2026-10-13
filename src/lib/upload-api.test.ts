import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    uploadedFile: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/admin/upload/route';
import {
  adminCategorySchema,
  adminProductImageSchema,
  customOrderFabricSchema,
} from '@/lib/validations';

const mockedRequireAdmin = vi.mocked(requireAdmin);
const db = prisma.uploadedFile as unknown as {
  create: ReturnType<typeof vi.fn>;
};

const adminSession = {
  userId: 'user_admin_1',
  email: 'admin@akagencies.com',
  role: 'ADMIN',
  name: 'Admin',
};

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03, 0x04,
]);
const SVG_BYTES = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
);

function uploadRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append('file', file);
  return new Request('http://localhost/api/admin/upload', {
    method: 'POST',
    body: formData,
  }) as unknown as NextRequest;
}

function pngFile(name = 'cover.png', bytes: Uint8Array = PNG_BYTES): File {
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue({ session: adminSession });
  db.create.mockResolvedValue({ id: 'cmtestuploaded0001' });
});

afterEach(() => {
  delete process.env.UPLOAD_MAX_IMAGE_BYTES;
  delete process.env.UPLOAD_MAX_VIDEO_BYTES;
});

describe('POST /api/admin/upload — authentication', () => {
  it('rejects unauthenticated requests', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const res = await POST(uploadRequest(pngFile()));

    expect(res.status).toBe(401);
    expect(db.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/upload — success', () => {
  it('persists the raw bytes in the database and returns a short URL', async () => {
    const res = await POST(uploadRequest(pngFile('cushion.png')));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.url).toBe('/api/img/cmtestuploaded0001');
    expect(json.data.type).toBe('image/png');
    expect(json.data.size).toBe(PNG_BYTES.length);
    expect(json.data.filename).toBe('cushion.png');
  });

  it('stores the exact bytes with the sniffed MIME type', async () => {
    await POST(uploadRequest(pngFile('cushion.png')));

    expect(db.create).toHaveBeenCalledTimes(1);
    const args = db.create.mock.calls[0][0];
    expect(args.select).toEqual({ id: true });
    expect(args.data.mimeType).toBe('image/png');
    expect(args.data.fileName).toBe('cushion.png');
    expect(args.data.fileSize).toBe(PNG_BYTES.length);
    expect(Array.from(args.data.data as Uint8Array)).toEqual(
      Array.from(PNG_BYTES),
    );
  });

  it('never returns base64 or data URLs', async () => {
    const res = await POST(uploadRequest(pngFile()));
    const text = await res.text();

    expect(text).not.toContain('data:');
    expect(text).not.toMatch(/[A-Za-z0-9+/]{100,}={0,2}/);
    expect(JSON.parse(text).data.url).toMatch(/^\/api\/img\/[A-Za-z0-9_-]+$/);
  });

  it('keeps the response shape used by the admin uploaders', async () => {
    const res = await POST(uploadRequest(pngFile()));
    const json = await res.json();

    expect(json).toHaveProperty('success');
    expect(json).toHaveProperty('data.url');
    expect(json).toHaveProperty('data.filename');
    expect(json).toHaveProperty('data.size');
    expect(json).toHaveProperty('data.type');
  });
});

describe('POST /api/admin/upload — validation', () => {
  it('rejects a request without a file', async () => {
    const formData = new FormData();
    formData.append('file', 'not-a-file');
    const req = new Request('http://localhost/api/admin/upload', {
      method: 'POST',
      body: formData,
    }) as unknown as NextRequest;

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/No file provided/);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects unsupported extensions', async () => {
    const res = await POST(uploadRequest(pngFile('payload.svg', SVG_BYTES)));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Unsupported file extension/);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects content that is not a real image even with an allowed extension', async () => {
    const file = new File([new Uint8Array(SVG_BYTES)], 'fake.png', {
      type: 'image/png',
    });

    const res = await POST(uploadRequest(file));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Unsupported file content/);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('does not trust the client-declared Content-Type', async () => {
    const file = new File([new Uint8Array(SVG_BYTES)], 'payload.png', {
      type: 'image/png',
    });

    const res = await POST(uploadRequest(file));

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects images above the configured size limit', async () => {
    process.env.UPLOAD_MAX_IMAGE_BYTES = '4';

    const res = await POST(uploadRequest(pngFile()));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/File too large/);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects anything above the hard video ceiling before reading bytes', async () => {
    process.env.UPLOAD_MAX_VIDEO_BYTES = '8';

    const res = await POST(uploadRequest(pngFile()));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/File too large/);
    expect(db.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/upload — failure handling', () => {
  it('returns a generic error without leaking database details', async () => {
    db.create.mockRejectedValue(
      new Error('connect ECONNREFUSED neondb:5432 password=hunter2'),
    );

    const res = await POST(uploadRequest(pngFile()));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ success: false, error: 'Upload failed' });

    const raw = JSON.stringify(json);
    expect(raw).not.toContain('ECONNREFUSED');
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('neondb');
  });
});

describe('image URL compatibility with existing admin workflows', () => {
  it('accepts database URLs produced by the new upload endpoint', () => {
    expect(
      adminCategorySchema.safeParse({
        name: 'Sofas',
        slug: 'sofas',
        imageUrl: '/api/img/cmtestuploaded0001',
      }).success,
    ).toBe(true);

    expect(
      adminProductImageSchema.safeParse({
        url: '/api/img/cmtestuploaded0001',
        alt: 'cover',
      }).success,
    ).toBe(true);

    expect(
      customOrderFabricSchema.safeParse({
        name: 'Silk',
        imageUrl: '/api/img/cmtestuploaded0001',
      }).success,
    ).toBe(true);
  });

  it('keeps external URLs working unchanged', () => {
    expect(
      adminCategorySchema.safeParse({
        name: 'Sofas',
        slug: 'sofas',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
      }).success,
    ).toBe(true);

    expect(
      adminProductImageSchema.safeParse({
        url: 'https://example.com/remote.jpg',
      }).success,
    ).toBe(true);

    expect(
      customOrderFabricSchema.safeParse({
        name: 'Silk',
        imageUrl: 'https://example.com/remote.jpg',
      }).success,
    ).toBe(true);
  });

  it('keeps pre-existing local /uploads paths working unchanged', () => {
    expect(
      adminCategorySchema.safeParse({
        name: 'Sofas',
        slug: 'sofas',
        imageUrl: '/uploads/1789731415324-60n1rz.jpeg',
      }).success,
    ).toBe(true);

    expect(
      adminProductImageSchema.safeParse({
        url: '/uploads/legacy-product.jpg',
      }).success,
    ).toBe(true);

    expect(
      customOrderFabricSchema.safeParse({
        name: 'Silk',
        imageUrl: '/uploads/silk.jpg',
      }).success,
    ).toBe(true);
  });

  it('still allows clearing an image on partial updates', () => {
    const result = adminCategorySchema.safeParse({
      name: 'Sofas',
      slug: 'sofas',
      imageUrl: null,
    });
    expect(result.success).toBe(true);
  });
});
