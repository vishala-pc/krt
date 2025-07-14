'use server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Test } from '@/lib/types';

async function findTestFilePath(testId: string): Promise<string | null> {
    const departmentsDir = path.join(process.cwd(), 'public', 'data');
    try {
        const departmentFolders = await fs.readdir(departmentsDir);

        for (const department of departmentFolders) {
            const departmentPath = path.join(departmentsDir, department);
            const stats = await fs.stat(departmentPath);
            if (!stats.isDirectory()) continue;
            
            const files = await fs.readdir(departmentPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(departmentPath, file);
                    try {
                        const fileContent = await fs.readFile(filePath, 'utf-8');
                        const test: Test = JSON.parse(fileContent);
                        if (test.id === testId) {
                            return filePath;
                        }
                    } catch (error) {
                         console.error(`Error reading or parsing ${filePath}:`, error);
                    }
                }
            }
        }
    } catch (error) {
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

    const testFilePath = await findTestFilePath(id);

    if (!testFilePath) {
        return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    
    await fs.unlink(testFilePath);

    return NextResponse.json({ message: 'Test deleted successfully' }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
        return NextResponse.json({ message: 'Test file not found during deletion.' }, { status: 404 });
    }
    console.error('API Error (delete test):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to delete test', error: errorMessage }, { status: 500 });
  }
}
