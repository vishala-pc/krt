'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import type { Test, Department } from '@/lib/types';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

// Mock data for available tests
const mockTests: Test[] = [
  {
    id: '1',
    title: 'General Knowledge Quiz',
    description: 'A fun quiz to test your general knowledge on various topics.',
    timeLimit: 10,
    questions: [
      { id: 'q1', question: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], correctAnswer: 'Paris', points: 10 },
      { id: 'q2', question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4', points: 10 },
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

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const userDepartment = (searchParams.get('department') as Department) || 'General';

  const availableTests = useMemo(() => {
    return mockTests.filter(test => test.department === userDepartment || test.department === 'General');
  }, [userDepartment]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1 font-headline">Available Tests</h1>
        <p className="text-muted-foreground mb-6">Showing tests for the <strong>{userDepartment}</strong> department.</p>

        {availableTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests.map((test) => (
              <Card key={test.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{test.title}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{test.questions.length} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{test.timeLimit} Minutes</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href={`/test/${test.id}`}>Start Test</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Tests Available</h3>
                <p className="text-muted-foreground mt-2">There are currently no tests assigned to the {userDepartment} department.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
