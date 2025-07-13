'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Test, Question, UserAnswer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Timer, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

interface TestClientProps {
  test: Test;
}

export default function TestClient({ test }: TestClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    clearInterval(timerRef.current);

    // In a real app, save results to the database here
    console.log('Submitting answers:', answers);

    router.push(`/results/${test.id}`);
  }, [answers, isSubmitted, router, test.id]);
  
  const handleAutoSubmit = useCallback((reason: string) => {
    if (isSubmitted) return;
    toast({
      variant: 'destructive',
      title: 'Test Auto-Submitted',
      description: `Reason: ${reason}. Your progress has been saved.`,
    });
    handleSubmit();
  }, [handleSubmit, isSubmitted, toast]);

  useEffect(() => {
    if (!isStarted || isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAutoSubmit('Switched to another tab or window');
      }
    };

    const handleBlur = () => {
      // Small timeout to prevent false positives when browser focus flickers (e.g., alerts)
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
      // If fullscreen fails, we still start the test but warn the user.
      // Some environments might not support it.
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
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2" /> Previous
          </Button>
          {currentQuestionIndex < test.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            >
              Next <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Submit Test <CheckCircle className="ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
