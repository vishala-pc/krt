// src/app/api/admin/tests/route.ts
'use server';
import { NextResponse } from 'next/server';
import type { Test, Question, Department } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// GET all tests
export async function GET() {
  const testsByDepartment: Record<string, Test[]> = {};
  const departmentsDir = path.join(process.cwd(), 'public', 'data');

  try {
    const departmentFolders = await fs.readdir(departmentsDir, { withFileTypes: true });

    for (const folder of departmentFolders) {
      if (folder.isDirectory()) {
        const departmentName = folder.name;
        const testsFilePath = path.join(departmentsDir, departmentName, 'tests.json');
        try {
          const fileContent = await fs.readFile(testsFilePath, 'utf-8');
          testsByDepartment[departmentName] = JSON.parse(fileContent);
        } catch (error) {
          // File might not exist, which is fine.
          testsByDepartment[departmentName] = [];
        }
      }
    }
    return NextResponse.json(testsByDepartment);
  } catch (error) {
    console.error('API Error (get all tests):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch tests', error: errorMessage }, { status: 500 });
  }
}


// POST a new test
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, timeLimit, department, questions: questionData } = body;
    
    if (!title || !timeLimit || !department || !questionData || !Array.isArray(questionData) || questionData.length === 0) {
      return NextResponse.json({ message: 'Missing required test data.' }, { status: 400 });
    }

    const questions: Question[] = questionData.map((q: any) => {
       if (!q.question || !q.options || !q.correctAnswer || q.points === undefined) {
        throw new Error(`Invalid question data provided.`);
      }
      return {
        id: uuidv4(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: Number(q.points),
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
      // File doesn't exist yet, which is fine.
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
