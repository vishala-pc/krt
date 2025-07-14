'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Test, Question, TestResult, Department } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Timer, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

interface TestClientProps {
  test: Test;
}

export default function TestClient({ test }: TestClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const firstName = searchParams.get('firstName') || 'Demo';
  const lastName = searchParams.get('lastName') || 'User';
  const userId = searchParams.get('userId') || 'user123';
  const department = (searchParams.get('department') as Department) || test.department;

  const userName = `${firstName} ${lastName}`;

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || isSubmitting) return;

    setIsSubmitting(true);
    clearInterval(timerRef.current);
    
    let score = 0;
    let totalPoints = 0;
    const userAnswers = test.questions.map(q => {
        totalPoints += q.points;
        const selectedOption = answers[q.id];
        if (selectedOption === q.correctAnswer) {
            score += q.points;
        }
        return { questionId: q.id, selectedOption: selectedOption || 'Not answered' };
    });

    const resultData: Omit<TestResult, '_id'> = {
        userId,
        firstName,
        lastName,
        testId: test.id,
        testTitle: test.title,
        department: department,
        score,
        totalPoints,
        answers: userAnswers,
        submittedAt: new Date(),
    };

    try {
        const response = await fetch('/api/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save results.');
        }

        const { id } = await response.json();
        setIsSubmitted(true);
        const queryParams = new URLSearchParams({ 
            department: department,
            firstName,
            lastName,
            userId,
        });
        router.push(`/results/${id}?${queryParams.toString()}`);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Submission Error',
            description: error instanceof Error ? error.message : 'Could not save your test results. Please try again.',
        });
        setIsSubmitting(false); // Allow user to try again
    }
  }, [answers, isSubmitted, isSubmitting, router, test, toast, department, firstName, lastName, userId]);
  
  const handleAutoSubmit = useCallback((reason: string) => {
    if (isSubmitted || isSubmitting) return;
    toast({
      variant: 'destructive',
      title: 'Test Auto-Submitted',
      description: `Reason: ${reason}. Your progress is being saved.`,
    });
    handleSubmit();
  }, [handleSubmit, isSubmitted, isSubmitting, toast]);

  useEffect(() => {
    if (!isStarted || isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAutoSubmit('Switched to another tab or window');
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (document.visibilityState === 'hidden' || !document.hasFocus()) {
          handleAutoSubmit('Left the test window');
        }
      }, 100);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isStarted, isSubmitted, handleAutoSubmit]);

  useEffect(() => {
    if (isStarted && !isSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit('Time ran out');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, isSubmitted, handleAutoSubmit]);

  const startTest = async () => {
    try {
      if (document.fullscreenEnabled) {
        await document.documentElement.requestFullscreen();
      }
      setIsStarted(true);
    } catch (err) {
      console.error('Failed to enter fullscreen mode:', err);
      setIsStarted(true);
      setIsWarningVisible(true);
    }
  };

  const currentQuestion: Question = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!isStarted) {
    return (
      <>
        <AlertDialog open={isWarningVisible} onOpenChange={setIsWarningVisible}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fullscreen Recommended</AlertDialogTitle>
              <AlertDialogDescription>
                Fullscreen mode could not be enabled automatically. For the best experience, please enable it manually. The test will start anyway.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsWarningVisible(false)}>Understood</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{test.title}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-muted-foreground">Welcome, {userName}</p>
              <div className="flex items-center justify-center gap-2 text-primary p-4 border-primary/20 border-2 rounded-lg bg-primary/5">
                <ShieldAlert className="w-8 h-8"/>
                <p className="text-left font-medium">
                  This test requires fullscreen mode. <br /> Switching tabs will result in auto-submission.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={startTest} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Start Test
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-background flex flex-col items-center justify-center">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl font-headline">{test.title}</CardTitle>
              <CardDescription>Question {currentQuestionIndex + 1} of {test.questions.length}</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              <Timer className="w-5 h-5" />
              <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="py-8">
          <p className="text-xl font-medium mb-8">{currentQuestion.question}</p>
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
            className="space-y-4"
          >
            {currentQuestion.options.map((option, index) => (
              <Label
                key={index}
                htmlFor={`option-${index}`}
                className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-secondary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary transition-colors"
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5 mr-4" />
                <span className="text-base">{option}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2" /> Previous
          </Button>
          {currentQuestionIndex < test.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={isSubmitting}
            >
              Next <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Test <CheckCircle className="ml-2" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
