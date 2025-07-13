import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import type { Test } from '@/lib/types';
import { FileText, Clock } from 'lucide-react';

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
  },
  {
    id: '2',
    title: 'React Fundamentals',
    description: 'Test your basic understanding of React hooks, components, and state.',
    timeLimit: 15,
    questions: [],
  },
  {
    id: '3',
    title: 'Advanced JavaScript Concepts',
    description: 'A challenging test covering closures, prototypes, and async patterns.',
    timeLimit: 20,
    questions: [],
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 font-headline">Available Tests</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTests.map((test) => (
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
      </main>
    </div>
  );
}
