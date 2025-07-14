'use server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    if (!department) {
        return NextResponse.json({ message: 'Department is required' }, { status: 400 });
    }

    const departmentDir = path.join(process.cwd(), 'public', 'data', department);

    try {
        const allFiles = await fs.readdir(departmentDir);
        const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
        return NextResponse.json(jsonFiles);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json([]); // No directory for department, return empty array
        }
        console.error(`API Error (list tests for ${department}):`, error);
        return NextResponse.json({ message: 'Failed to list tests' }, { status: 500 });
    }
}
