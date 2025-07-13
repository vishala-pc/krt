'use server';
import { NextResponse } from 'next/server';
import type { TestResult } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const resultsDir = path.join(process.cwd(), 'data', 'results');
    const resultFiles = await fs.readdir(resultsDir).catch(() => []);

    const results: TestResult[] = [];

    for (const file of resultFiles) {
      if (file.endsWith('.json')) {
        const filePath = path.join(resultsDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        results.push(JSON.parse(fileContent));
      }
    }

    // Sort results by submission date, most recent first
    results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return NextResponse.json(results);

  } catch (error) {
    console.error('API Error (get results):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch results', error: errorMessage }, { status: 500 });
  }
}
