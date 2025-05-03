import { NextRequest, NextResponse } from 'next/server';
import { storeMetadata, generateMetadataId } from './utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const METADATA_CACHE: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.name || typeof data.name !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid name' }, { status: 400 });
    }
    
    // Generate a unique ID for this metadata
    const id = generateMetadataId();
    
    // Store in memory cache
    storeMetadata(id, data);
    
    // Return the URL that can be used to access this metadata
    return NextResponse.json({
      id,
      url: `${request.nextUrl.origin}/api/metadata/${id}`
    });
  } catch (error) {
    console.error('Error creating metadata:', error);
    return NextResponse.json(
      { error: 'Failed to create metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id || request.nextUrl.pathname.split('/').pop();
  
  if (!id || !METADATA_CACHE[id]) {
    return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
  }
  
  // Return the stored metadata without the timestamp
  const { timestamp, ...metadata } = METADATA_CACHE[id];
  
  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 