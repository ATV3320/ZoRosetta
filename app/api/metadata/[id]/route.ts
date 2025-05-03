import { NextRequest, NextResponse } from 'next/server';

// Import the metadata cache from the parent route
import { getMetadata } from '../utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json({ error: 'Metadata ID is required' }, { status: 400 });
  }
  
  const metadata = getMetadata(id);
  
  if (!metadata) {
    return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
  }
  
  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 