import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import {
  formatMegabytes,
  getVideoMaxBytes,
  validateUpload,
} from '@/lib/image-storage';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const formData = await request.formData();
    const entry = formData.get('file');

    if (!entry || typeof entry === 'string') {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    const videoMaxBytes = getVideoMaxBytes();
    if (entry.size > videoMaxBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${formatMegabytes(videoMaxBytes)}`,
        },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await entry.arrayBuffer());
    const check = validateUpload(entry.name, bytes);

    if (!check.ok) {
      return NextResponse.json(
        { success: false, error: check.error },
        { status: 400 },
      );
    }

    const stored = await prisma.uploadedFile.create({
      data: {
        data: bytes,
        mimeType: check.mimeType,
        fileName: check.fileName,
        fileSize: check.size,
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        url: `/api/img/${stored.id}`,
        filename: check.fileName,
        size: check.size,
        type: check.mimeType,
      },
    });
  } catch (error) {
    console.error(
      '[admin/upload] failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 },
    );
  }
}
