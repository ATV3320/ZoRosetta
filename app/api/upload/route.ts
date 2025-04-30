import { NextRequest, NextResponse } from 'next/server';
import { pinata } from '@/utils/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer and create a readable stream
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a new File object from the buffer
    const uploadFile = new File([buffer], file.name, { type: file.type });

    // Upload to Pinata using the SDK
    const result = await pinata.upload.public.file(uploadFile);

    // Get the gateway URL
    const url = await pinata.gateways.public.convert(result.cid);

    return NextResponse.json({
      url,
      cid: result.cid
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Upload to Pinata failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}