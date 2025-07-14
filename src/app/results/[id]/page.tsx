import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { TestResult, Question, Test, Department } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

async function getResult(id: string): Promise<TestResult | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'results', `${id}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const result = JSON.parse(fileContent);
    return result;
  } catch (error) {
    console.error(`Failed to fetch result for id: ${id}`, error);
    return null;
  }
}

async function getAllTests(): Promise<Test[]> {
    const allTests: Test[] = [];
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
                        allTests.push(JSON.parse(fileContent));
                    } catch (readError) {
                        console.error(`Failed to read or parse ${filePath}:`, readError);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to read test directories:", error);
    }
    return allTests;
}

async function getTest(testId: string): Promise<Test | null> {
    const allTests = await getAllTests();
    return allTests.find(t => t.id === testId) || null;
}


export default async function ResultsPage({ params, searchParams }: { params: { id: string }, searchParams: { department?: Department, firstName?: string, lastName?: string, userId?: string } }) {
  const result = await getResult(params.id);
  
  if (!result) {
    return (
       <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
           <Card className="max-w-2xl w-full text-center">
                <CardHeader>
                    <CardTitle className="flex justify-center items-center gap-2"><AlertTriangle className="text-destructive" />Result Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The result you are looking for could not be found. It may have been moved, deleted, or never existed.</p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
           </Card>
        </main>
      </div>
    )
  }

  const department = result.department;
  const firstName = result.firstName;
  const lastName = result.lastName;
  const userId = result.userId;

  const test = await getTest(result.testId);
  const questions = test?.questions || [];
  
  const dashboardLink = `/dashboard?${new URLSearchParams({
    department,
    firstName,
    lastName,
    userId,
  }).toString()}`;

  const userName = `${firstName} ${lastName}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Test Results</CardTitle>
            <CardDescription>Results for: {result.testTitle} <br/> Submitted by: {userName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center my-8">
              <p className="text-lg text-muted-foreground">Your Score</p>
              <p className="text-6xl font-bold text-primary">{result.score} / <span className="text-4xl text-foreground">{result.totalPoints}</span></p>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-center">Answer Breakdown</h3>
            <Accordion type="single" collapsible className="w-full">
              {questions.map((question, index) => {
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
                <Link href={dashboardLink}>Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
