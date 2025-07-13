import TestClient from '@/components/TestClient';
import type { Test, Department } from '@/lib/types';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

// This function now reads from the local filesystem on the server
const getTestById = async (id: string, department: Department): Promise<Test | null> => {
  try {
    const generalFilePath = path.join(process.cwd(), 'public', 'data', 'General', 'tests.json');
    
    let allTests: Test[] = [];

    // Load general tests
    try {
        const generalFile = await fs.readFile(generalFilePath, 'utf-8');
        allTests.push(...JSON.parse(generalFile));
    } catch (e) {
        console.warn("Could not load general tests, file might be missing.");
    }

    // Load department-specific tests if not General
    if (department !== 'General') {
        const departmentFilePath = path.join(process.cwd(), 'public', 'data', `${department}`, 'tests.json');
        try {
            const departmentFile = await fs.readFile(departmentFilePath, 'utf-8');
            allTests.push(...JSON.parse(departmentFile));
        } catch (e) {
            console.warn(`Could not load tests for ${department}, file might be missing.`);
        }
    }

    const test = allTests.find(t => t.id === id);
    return test || null;
  } catch (error) {
    console.error("Error reading test files:", error);
    return null;
  }
};

export default async function TestPage({ params, searchParams }: { params: { id: string }, searchParams: { department: Department } }) {
  const department = searchParams.department || 'General';
  const test = await getTestById(params.id, department);

  if (!test) {
    notFound();
  }

  return <TestClient test={test} department={department} />;
}
