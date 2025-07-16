'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import type { Test, Department, TestResult } from '@/lib/types';
import { FileText, Clock, AlertCircle, Award, Calendar, CheckCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';


async function getTestsForDepartment(department: Department): Promise<Test[]> {
    try {
        const generalRes = await fetch('/api/tests/list?department=General');
        const generalFiles: string[] = await generalRes.json();
        
        const generalTests = await Promise.all(
            generalFiles.map(async (file) => {
                const res = await fetch(`/data/General/${file}`);
                return res.json();
            })
        );

        if (department === 'General') {
            return generalTests;
        }

        const departmentRes = await fetch(`/api/tests/list?department=${encodeURIComponent(department)}`);
        if (!departmentRes.ok) {
            return generalTests;
        }
        const departmentFiles: string[] = await departmentRes.json();
        const departmentTests = await Promise.all(
             departmentFiles.map(async (file) => {
                const res = await fetch(`/data/${department}/${file}`);
                return res.json();
            })
        );
        
        return [...generalTests, ...departmentTests];
    } catch (error) {
        console.error("Failed to fetch tests:", error);
        return [];
    }
}

async function getUserResults(userId: string): Promise<TestResult[]> {
    if (!userId) return [];
    try {
        const response = await fetch(`/api/results/${userId}`);
        if (!response.ok) return [];
        const results = await response.json();
        return Array.isArray(results) ? results : [];
    } catch (error) {
        console.error("Failed to fetch user results:", error);
        return [];
    }
}


export default function DashboardPage() {
  const searchParams = useSearchParams();
  const userDepartment = (searchParams.get('department') as Department) || 'General';
  const firstName = searchParams.get('firstName') || 'Demo';
  const lastName = searchParams.get('lastName') || 'User';
  const userId = searchParams.get('userId') || 'user123';

  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [userResults, setUserResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [tests, results] = await Promise.all([
          getTestsForDepartment(userDepartment),
          getUserResults(userId)
      ]);
      setAvailableTests(tests);
      setUserResults(results);
      setIsLoading(false);
    }
    if (userId) {
        loadData();
    }
  }, [userDepartment, userId]);
  
  const uniqueTests = useMemo(() => {
    const seenIds = new Set();
    return availableTests.filter(test => {
      if (!test || !test.id) return false;
      if (seenIds.has(test.id)) {
        return false;
      } else {
        seenIds.add(test.id);
        return true;
      }
    });
  }, [availableTests]);

  const testsWithResults = useMemo(() => {
    return uniqueTests.map(test => {
      const result = userResults.find(r => r.testId === test.id);
      return { ...test, result };
    });
  }, [uniqueTests, userResults]);


  if (isLoading) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-1 font-headline">Available Tests</h1>
                <p className="text-muted-foreground mb-6">Loading tests for the <strong>{userDepartment}</strong> department...</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}><CardHeader><CardTitle>Loading...</CardTitle></CardHeader><CardContent><p>Please wait.</p></CardContent></Card>
                    ))}
                </div>
            </main>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1 font-headline">Available Tests</h1>
        <p className="text-muted-foreground mb-6">Showing tests for the <strong>{userDepartment}</strong> department.</p>

        {testsWithResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testsWithResults.map((test) => {
              const testLink = `/test/${test.id}?${new URLSearchParams({
                department: userDepartment,
                firstName,
                lastName,
                userId,
              })}`;

              const percentage = test.result ? Math.round((test.result.score / test.result.totalPoints) * 100) : 0;
              const resultLink = test.result ? `/results/${test.result._id}?${new URLSearchParams({
                  department: userDepartment,
                  firstName,
                  lastName,
                  userId,
              })}` : '#';

              return (
              <Card key={test.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{test.title}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{test.questions?.length ?? 0} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{test.timeLimit} Minutes</span>
                    </div>
                  </div>
                   {test.result && (
                     <div className="mt-4 border-t pt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            <span>Test Completed</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(test.result.submittedAt), 'PP')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Award className="w-4 h-4" />
                            <span>Score: {test.result.score}/{test.result.totalPoints} ({percentage}%)</span>
                        </div>
                     </div>
                   )}
                </CardContent>
                <CardFooter>
                  {test.result ? (
                     <Button asChild className="w-full" variant="outline">
                        <Link href={resultLink}>View Result</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href={testLink}>Start Test</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )})}
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
