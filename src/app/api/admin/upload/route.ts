import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const VIDEO_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      const allowed = [...ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]), ...ALLOWED_VIDEO_TYPES.map(t => t.split('/')[1])];
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed: ${allowed.join(', ')}` },
        { status: 400 },
      );
    }

    const maxSize = isVideo ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (isImage ? 'jpg' : 'mp4');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production (Vercel): store in Vercel Blob — the serverless filesystem
      // is read-only, so writing to public/uploads fails there.
      try {
        const blob = await put(`uploads/${filename}`, buffer, {
          access: 'public',
          contentType: file.type,
          addRandomSuffix: true,
          allowOverwrite: true,
        });
        url = blob.url;
      } catch (blobError) {
        console.error('[admin/upload] blob put failed:', blobError);
        const detail =
          blobError instanceof Error ? blobError.message : String(blobError);
        return NextResponse.json(
          { success: false, error: `Storage upload failed: ${detail}` },
          { status: 500 },
        );
      }
    } else if (process.env.VERCEL) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Image storage is not configured. Create a Vercel Blob store (Project → Storage) and redeploy.',
        },
        { status: 500 },
      );
    } else {
      // Local development: write to public/uploads as before.
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filepath = path.join(uploadDir, filename);
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filepath, buffer);
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({
      success: true,
      data: { url, filename, size: file.size, type: file.type },
    });
  } catch (error) {
    console.error('[admin/upload] failed:', error);
    const detail = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(
      { success: false, error: detail },
      { status: 500 },
    );
  }
}
