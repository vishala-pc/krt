'use server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Result ID is required' }, { status: 400 });
    }

    // Basic validation to prevent directory traversal
    if (id.includes('..') || id.includes('/')) {
        return NextResponse.json({ message: 'Invalid Result ID' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'results', `${id}.json`);
    
    await fs.unlink(filePath);

    return NextResponse.json({ message: 'Result deleted successfully' }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
        return NextResponse.json({ message: 'Result not found' }, { status: 404 });
    }
    console.error('API Error (delete result):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to delete result', error: errorMessage }, { status: 500 });
  }
}
