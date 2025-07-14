import TestClient from '@/components/TestClient';
import type { Test, Department } from '@/lib/types';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

// This function now reads from the local filesystem on the server
const getTestById = async (id: string): Promise<Test | null> => {
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
            const testData: Test = JSON.parse(fileContent);
            if (testData.id === id) {
              return testData;
            }
          } catch (e) {
            console.error(`Error reading or parsing test file ${filePath}:`, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading test directories:", error);
  }
  return null;
};

export default async function TestPage({ params, searchParams }: { params: { id: string }, searchParams: { department: Department } }) {
  const department = searchParams.department || 'General';
  const test = await getTestById(params.id);

  if (!test) {
    notFound();
  }

  return <TestClient test={test} />;
}
