'use server';
import { NextResponse } from 'next/server';
import type { TestResult } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const result: Omit<TestResult, '_id'> = await request.json();
    const resultId = uuidv4();
    const resultWithId: TestResult = { ...result, _id: resultId };

    const resultsDir = path.join(process.cwd(), 'data', 'results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const filePath = path.join(resultsDir, `${resultId}.json`);
    await fs.writeFile(filePath, JSON.stringify(resultWithId, null, 2));

    return NextResponse.json({ message: 'Result saved successfully', id: resultId }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to save result', error: errorMessage }, { status: 500 });
  }
}
