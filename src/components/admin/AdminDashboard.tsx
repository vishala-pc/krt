'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TestResult, Department, Question } from '@/lib/types';
import { Upload, ListOrdered, Loader2, AlertCircle, ExternalLink, Search, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';


export default function AdminDashboard() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for the new test form
  const [testTitle, setTestTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);

  // State for the current question being added
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState('');
  
  const departments: Department[] = [
    'Python Developer',
    'R&D',
    'Sales',
    'Marketing',
    'Project Coordinators',
    'QA',
    'Delivery Manager',
    'IT',
    'General'
  ];

  useEffect(() => {
    async function fetchResults() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/admin/results');
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load test results.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [toast]);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return results;
    const lowercasedFilter = searchTerm.toLowerCase();
    return results.filter(result => {
      const fullName = `${result.firstName || ''} ${result.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(lowercasedFilter) ||
        (result.testTitle && result.testTitle.toLowerCase().includes(lowercasedFilter)) ||
        (result.department && result.department.toLowerCase().includes(lowercasedFilter))
      );
    });
  }, [results, searchTerm]);


  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    if (!currentQuestion || options.some(o => !o) || !correctAnswer || !points) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Question',
        description: 'Please fill out all fields for the question.',
      });
      return;
    }
    if (!options.includes(correctAnswer)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Correct Answer',
            description: 'The correct answer must be one of the options.',
        });
        return;
    }

    const newQuestion: Omit<Question, 'id'> = {
      question: currentQuestion,
      options: options.filter(Boolean),
      correctAnswer,
      points: Number(points),
    };

    setQuestions([...questions, newQuestion]);

    // Reset form
    setCurrentQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setPoints('');
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };


  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle || !timeLimit || !department || questions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Test',
        description: 'Please provide a title, time limit, department, and at least one question.',
      });
      return;
    }

    setIsUploading(true);

    const testData = {
        title: testTitle,
        timeLimit: Number(timeLimit),
        department,
        questions,
    };

    try {
      const response = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create test.');
      }

      toast({
        title: 'Test Created Successfully',
        description: `Test "${testTitle}" has been created.`,
      });
      // Reset form
      setTestTitle('');
      setTimeLimit('');
      setDepartment('');
      setQuestions([]);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Creation Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
    } finally {
        setIsUploading(false);
    }
  };

  const renderResultsContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Loading results...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>Error loading results: {error}</p>
        </div>
      );
    }
    
    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <ListOrdered className="h-8 w-8 mb-2" />
          <p>No test results have been submitted yet.</p>
        </div>
      );
    }

    return (
      <>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by user, test title, or department..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Test Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result._id}>
                  <TableCell>{result.firstName} {result.lastName}</TableCell>
                  <TableCell>{result.testTitle}</TableCell>
                  <TableCell>{result.department}</TableCell>
                  <TableCell>{result.score}/{result.totalPoints}</TableCell>
                  <TableCell>{format(new Date(result.submittedAt), 'PPp')}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/results/${result._id}?department=${result.department}&firstName=${result.firstName}&lastName=${result.lastName}`} target="_blank">View <ExternalLink className="ml-2 h-3 w-3" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <Tabs defaultValue="results" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="results"><ListOrdered className="mr-2" /> View Results</TabsTrigger>
        <TabsTrigger value="upload"><Upload className="mr-2" /> Create Test</TabsTrigger>
      </TabsList>
      <TabsContent value="results">
        <Card>
          <CardHeader>
            <CardTitle>User Test Results</CardTitle>
            <CardDescription>A summary of all tests taken by users. Search by name, test, or department.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderResultsContent()}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Create New Test</CardTitle>
            <CardDescription>Build a new test by providing its details and adding questions one by one.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTest} className="space-y-8">
              {/* Test Details Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Test Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title</Label>
                  <Input id="title" value={testTitle} onChange={e => setTestTitle(e.target.value)} type="text" placeholder="e.g., General Knowledge Quiz" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input id="timeLimit" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} type="number" placeholder="e.g., 30" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select name="department" required value={department} onValueChange={(value) => setDepartment(value as Department)}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Assign to a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Add Question Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Add a Question</h3>
                <div className="space-y-2">
                  <Label htmlFor="question">Question Text</Label>
                  <Input id="question" value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} placeholder="What is the capital of France?" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {options.map((opt, index) => (
                    <div className="space-y-2" key={index}>
                      <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                      <Input id={`option-${index}`} value={opt} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">Correct Answer</Label>
                    <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                      <SelectTrigger id="correctAnswer">
                        <SelectValue placeholder="Select the correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.filter(Boolean).map((opt, index) => (
                          <SelectItem key={index} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input id="points" value={points} onChange={e => setPoints(e.target.value)} type="number" placeholder="e.g., 10" />
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={handleAddQuestion}>
                  <PlusCircle /> Add Question to Test
                </Button>
              </div>

              {/* Added Questions Section */}
              {questions.length > 0 && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-medium">Test Questions ({questions.length})</h3>
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-md bg-secondary/50">
                        <div>
                          <p className="font-semibold">{index + 1}. {q.question}</p>
                          <p className="text-sm text-muted-foreground">Options: {q.options.join(', ')}</p>
                          <p className="text-sm text-green-600">Correct: {q.correctAnswer} ({q.points} pts)</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveQuestion(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isUploading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full text-base">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Test...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" /> Create & Save Test
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
