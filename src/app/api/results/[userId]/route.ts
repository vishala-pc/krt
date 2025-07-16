'use server';
import { NextResponse } from 'next/server';
import type { TestResult } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const resultsDir = path.join(process.cwd(), 'data', 'results');
    const resultFiles = await fs.readdir(resultsDir).catch(() => []);

    const userResults: TestResult[] = [];

    for (const file of resultFiles) {
      if (file.endsWith('.json')) {
        const filePath = path.join(resultsDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const result: TestResult = JSON.parse(fileContent);
        if (result.userId === userId) {
            userResults.push(result);
        }
      }
    }

    // Sort results by submission date, most recent first
    userResults.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return NextResponse.json(userResults);

  } catch (error) {
    console.error('API Error (get user results):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch user results', error: errorMessage }, { status: 500 });
  }
}
