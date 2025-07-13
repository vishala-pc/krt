// src/app/api/admin/tests/route.ts
'use server';
import { NextResponse } from 'next/server';
import type { Test, Question, Department } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';

// Helper function to convert buffer to array buffer
function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const timeLimit = formData.get('timeLimit') as string;
    const department = formData.get('department') as Department;
    
    if (!file || !title || !timeLimit || !department) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<any>(sheet);

    const questions: Question[] = data.map((row, index) => {
      const options = [row['Option A'], row['Option B'], row['Option C'], row['Option D']].filter(Boolean);
      if (!row['Question'] || !row['Answer'] || !row['Point'] || options.length < 2) {
        throw new Error(`Invalid data in row ${index + 2} of the Excel file.`);
      }
      return {
        id: uuidv4(),
        question: row['Question'],
        options: options,
        correctAnswer: row['Answer'],
        points: Number(row['Point']),
      };
    });

    const newTest: Test = {
      id: uuidv4(),
      title,
      description: `A new test for ${department}.`,
      timeLimit: Number(timeLimit),
      department,
      questions,
    };

    const departmentDir = path.join(process.cwd(), 'public', 'data', department);
    await fs.mkdir(departmentDir, { recursive: true });

    const testsFilePath = path.join(departmentDir, 'tests.json');
    let existingTests: Test[] = [];

    try {
      const fileContent = await fs.readFile(testsFilePath, 'utf-8');
      existingTests = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist yet, which is fine
    }

    existingTests.push(newTest);

    await fs.writeFile(testsFilePath, JSON.stringify(existingTests, null, 2));

    return NextResponse.json({ message: 'Test created successfully', testId: newTest.id }, { status: 201 });

  } catch (error) {
    console.error('API Error (create test):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create test', error: errorMessage }, { status: 500 });
  }
}