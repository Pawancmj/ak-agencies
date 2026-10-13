import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!ID_PATTERN.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const stored = await prisma.uploadedFile.findUnique({
      where: { id },
      select: { data: true, mimeType: true },
    });

    if (!stored) {
      return new NextResponse(null, { status: 404 });
    }

    const body = new Uint8Array(stored.data);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': stored.mimeType,
        'Content-Length': String(body.byteLength),
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error(
      '[api/img] failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
    return new NextResponse(null, { status: 500 });
  }
}
