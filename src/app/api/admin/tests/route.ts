'use server';
import { NextResponse } from 'next/server';
import type { Test, Question, Department } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_').toLowerCase();
}

// GET all tests
export async function GET() {
  const testsByDepartment: Record<string, Test[]> = {};
  const departmentsDir = path.join(process.cwd(), 'public', 'data');

  try {
    const departmentFolders = await fs.readdir(departmentsDir, { withFileTypes: true });

    for (const folder of departmentFolders) {
      if (folder.isDirectory()) {
        const departmentName = folder.name;
        const departmentPath = path.join(departmentsDir, departmentName);
        testsByDepartment[departmentName] = [];
        
        try {
            const files = await fs.readdir(departmentPath);
            for (const file of files) {
                if(file.endsWith('.json')) {
                    const filePath = path.join(departmentPath, file);
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    testsByDepartment[departmentName].push(JSON.parse(fileContent));
                }
            }
        } catch (error) {
             // Folder might be empty or other read error, which is fine.
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

    const filename = `${sanitizeFilename(newTest.title)}_${newTest.id.substring(0, 8)}.json`;
    const testsFilePath = path.join(departmentDir, filename);

    await fs.writeFile(testsFilePath, JSON.stringify(newTest, null, 2));

    return NextResponse.json({ message: 'Test created successfully', testId: newTest.id }, { status: 201 });

  } catch (error) {
    console.error('API Error (create test):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create test', error: errorMessage }, { status: 500 });
  }
}
