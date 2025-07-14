'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import type { Test, Department } from '@/lib/types';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

async function fetchJsonFiles(url: string): Promise<Test[]> {
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        // This assumes the endpoint returns a list of filenames
        const filenames: string[] = await response.json().catch(() => []); 
        
        const tests = await Promise.all(filenames.map(async (filename) => {
            if (!filename.endsWith('.json')) return null;
            const testRes = await fetch(`${url}/${filename}`);
            if (!testRes.ok) return null;
            return testRes.json();
        }));
        return tests.filter((t): t is Test => t !== null);
    } catch {
        return [];
    }
}

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


export default function DashboardPage() {
  const searchParams = useSearchParams();
  const userDepartment = (searchParams.get('department') as Department) || 'General';
  const firstName = searchParams.get('firstName') || 'Demo';
  const lastName = searchParams.get('lastName') || 'User';
  const userId = searchParams.get('userId') || 'user123';

  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTests() {
      setIsLoading(true);
      const tests = await getTestsForDepartment(userDepartment);
      setAvailableTests(tests);
      setIsLoading(false);
    }
    loadTests();
  }, [userDepartment]);


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

        {availableTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests.map((test) => {
              const testLink = `/test/${test.id}?${new URLSearchParams({
                department: userDepartment,
                firstName,
                lastName,
                userId,
              })}`;
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
                    <Link href={testLink}>Start Test</Link>
                  </Button>
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
