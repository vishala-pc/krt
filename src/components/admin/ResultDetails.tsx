import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Test, TestResult } from '@/lib/types';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ResultDetailsProps {
    result: TestResult | null;
    test: Test | null;
}

export default function ResultDetails({ result, test }: ResultDetailsProps) {
    if (!result) {
        return (
            <div className="flex items-center justify-center p-8 text-destructive">
                <AlertTriangle className="h-8 w-8 mr-2" />
                <p>Result data is not available.</p>
            </div>
        );
    }
    
    const questions = test?.questions || [];
    const userName = `${result.firstName} ${result.lastName}`;

    return (
        <Card className="shadow-none border-none">
            <CardHeader className="text-center px-0">
                <CardTitle className="text-2xl font-headline">Test Results</CardTitle>
                <CardDescription>Results for: {result.testTitle} <br /> Submitted by: {userName}</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <div className="text-center my-6">
                    <p className="text-md text-muted-foreground">Score</p>
                    <p className="text-5xl font-bold text-primary">{result.score} / <span className="text-3xl text-foreground">{result.totalPoints}</span></p>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-center">Answer Breakdown</h3>
                {questions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {questions.map((question, index) => {
                            const userAnswer = result.answers.find(a => a.questionId === question.id);
                            const isCorrect = userAnswer?.selectedOption === question.correctAnswer;
                            return (
                                <AccordionItem key={question.id} value={`item-${index}`}>
                                    <AccordionTrigger className="hover:no-underline text-left">
                                        <div className="flex items-start gap-4 w-full">
                                            {isCorrect ? (
                                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                                            )}
                                            <span className="flex-1">{question.question}</span>
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
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p>Could not load the original test questions to show a breakdown.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
