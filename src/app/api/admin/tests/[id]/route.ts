'use server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Test } from '@/lib/types';

async function findTestAndFilePath(testId: string): Promise<{filePath: string, tests: Test[], testIndex: number} | null> {
    const departmentsDir = path.join(process.cwd(), 'public', 'data');
    try {
        const departmentFolders = await fs.readdir(departmentsDir);

        for (const department of departmentFolders) {
            const testsFilePath = path.join(departmentsDir, department, 'tests.json');
            try {
                const fileContent = await fs.readFile(testsFilePath, 'utf-8');
                const tests: Test[] = JSON.parse(fileContent);
                const testIndex = tests.findIndex(t => t.id === testId);

                if (testIndex !== -1) {
                    return { filePath: testsFilePath, tests, testIndex };
                }
            } catch (error) {
                // Ignore if tests.json doesn't exist in a folder
            }
        }
    } catch (error) {
        // This will happen if the main /public/data directory doesn't exist
        console.error("Error reading department directories", error);
    }
    return null;
}


export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Test ID is required' }, { status: 400 });
    }

    if (id.includes('..') || id.includes('/')) {
        return NextResponse.json({ message: 'Invalid Test ID' }, { status: 400 });
    }

    const testInfo = await findTestAndFilePath(id);

    if (!testInfo) {
        return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    const { filePath, tests, testIndex } = testInfo;
    
    // Remove the test from the array
    tests.splice(testIndex, 1);

    // Write the updated tests array back to the file
    await fs.writeFile(filePath, JSON.stringify(tests, null, 2));

    return NextResponse.json({ message: 'Test deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (delete test):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to delete test', error: errorMessage }, { status: 500 });
  }
}
