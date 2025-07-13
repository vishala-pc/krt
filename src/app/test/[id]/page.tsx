import TestClient from '@/components/TestClient';
import type { Test } from '@/lib/types';
import { notFound } from 'next/navigation';

// Mock data for a single test
const mockTests: Test[] = [
  {
    id: '1',
    title: 'General Knowledge Quiz',
    description: 'A fun quiz to test your general knowledge on various topics.',
    timeLimit: 10,
    questions: [
      { id: 'q1', question: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], correctAnswer: 'Paris', points: 10 },
      { id: 'q2', question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4', points: 10 },
      { id: 'q3', question: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswer: 'Mars', points: 10 },
      { id: 'q4', question: 'Who wrote "To Kill a Mockingbird"?', options: ['Harper Lee', 'J.K. Rowling', 'Ernest Hemingway', 'Mark Twain'], correctAnswer: 'Harper Lee', points: 15 },
      { id: 'q5', question: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 'Pacific', points: 10 },
    ],
    department: 'General',
  },
  {
    id: '2',
    title: 'React Fundamentals',
    description: 'Test your basic understanding of React hooks, components, and state.',
    timeLimit: 15,
    questions: [],
    department: 'R&D',
  },
  {
    id: '3',
    title: 'Advanced JavaScript Concepts',
    description: 'A challenging test covering closures, prototypes, and async patterns.',
    timeLimit: 20,
    questions: [],
    department: 'R&D',
  },
    {
    id: '4',
    title: 'Python for Beginners',
    description: 'A test for new python developers.',
    timeLimit: 20,
    questions: [],
    department: 'Python Developer',
  },
  {
    id: '5',
    title: 'Sales Strategy',
    description: 'A test on modern sales techniques.',
    timeLimit: 15,
    questions: [],
    department: 'Sales',
  },
  {
    id: '6',
    title: 'Marketing 101',
    description: 'Basics of marketing and branding.',
    timeLimit: 10,
    questions: [],
    department: 'Marketing',
  },
];


const getTestById = async (id: string): Promise<Test | null> => {
  // In a real app, you would fetch this from your database (e.g., Firestore)
  const test = mockTests.find(t => t.id === id);
  return test || null;
};

export default async function TestPage({ params }: { params: { id: string } }) {
  const test = await getTestById(params.id);

  if (!test) {
    notFound();
  }

  return <TestClient test={test} />;
}
