import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { TestResult } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const result: TestResult = await request.json();
    const db = await getDb(); 

    const collection = db.collection<TestResult>('results');
    const { acknowledged, insertedId } = await collection.insertOne(result);

    if (acknowledged) {
      return NextResponse.json({ message: 'Result saved successfully', id: insertedId }, { status: 201 });
    } else {
      throw new Error('Failed to insert result into database.');
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to save result', error: errorMessage }, { status: 500 });
  }
}
