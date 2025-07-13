import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle } from 'lucide-react';
import type { TestResult, Test } from '@/lib/types';

// Mock data
const mockTest: Test = {
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
};

const mockResult: TestResult = {
  id: 'res1',
  testId: '1',
  userId: 'user1',
  score: 35,
  totalPoints: 55,
  submittedAt: new Date(),
  answers: [
    { questionId: 'q1', selectedOption: 'Paris' },
    { questionId: 'q2', selectedOption: '4' },
    { questionId: 'q3', selectedOption: 'Jupiter' },
    { questionId: 'q4', selectedOption: 'Harper Lee' },
    { questionId: 'q5', selectedOption: 'Atlantic' },
  ],
};

export default function ResultsPage({ params }: { params: { id: string } }) {
  // In a real app, fetch results and test data based on params.id
  const test = mockTest;
  const result = mockResult;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Test Results</CardTitle>
            <CardDescription>Results for: {test.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center my-8">
              <p className="text-lg text-muted-foreground">Your Score</p>
              <p className="text-6xl font-bold text-primary">{result.score} / <span className="text-4xl text-foreground">{result.totalPoints}</span></p>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-center">Answer Breakdown</h3>
            <Accordion type="single" collapsible className="w-full">
              {test.questions.map((question, index) => {
                const userAnswer = result.answers.find(a => a.questionId === question.id);
                const isCorrect = userAnswer?.selectedOption === question.correctAnswer;
                return (
                  <AccordionItem key={question.id} value={`item-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 w-full">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        )}
                        <span className="text-left flex-1">{question.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-9">
                      <div className="space-y-2 text-sm">
                        <p>Your answer: <span className={isCorrect ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>{userAnswer?.selectedOption || 'Not answered'}</span></p>
                        {!isCorrect && <p>Correct answer: <span className="text-green-600 font-semibold">{question.correctAnswer}</span></p>}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
