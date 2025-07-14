'use server';
import { NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const usersFilePath = path.join(process.cwd(), 'data', 'users', 'users.json');

async function getUsers(): Promise<User[]> {
  try {
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    return [];
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, department } = await request.json();

    if (!email || !password || !firstName || !lastName || !department) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const users = await getUsers();
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // WARNING: Storing plain text passwords is a major security risk.
    // This is for demonstration purposes only. In a real app, use a hashing library like bcrypt.
    const newUser: User = {
      id: uuidv4(),
      email,
      password, // Insecure!
      firstName,
      lastName,
      department,
    };

    users.push(newUser);
    await saveUsers(users);

    return NextResponse.json({ message: 'User created successfully', userId: newUser.id }, { status: 201 });

  } catch (error) {
    console.error('API Error (signup):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create user', error: errorMessage }, { status: 500 });
  }
}
