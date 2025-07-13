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
import type { TestResult, Department, Question, Test } from '@/lib/types';
import { Upload, ListOrdered, Loader2, AlertCircle, ExternalLink, Search, PlusCircle, Trash2, FileCog } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export default function AdminDashboard() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [allTests, setAllTests] = useState<Record<string, Test[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for deletion confirmation
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'result' | 'test'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function fetchResults() {
    try {
      const response = await fetch('/api/admin/results');
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load test results.' });
    }
  }

  async function fetchTests() {
    try {
      const response = await fetch('/api/admin/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setAllTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load tests.' });
    }
  }
  
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchResults(), fetchTests()]);
      setIsLoading(false);
    }
    loadData();
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
      toast({ variant: 'destructive', title: 'Incomplete Question', description: 'Please fill out all fields for the question.' });
      return;
    }
    if (!options.includes(correctAnswer)) {
      toast({ variant: 'destructive', title: 'Invalid Correct Answer', description: 'The correct answer must be one of the options.' });
      return;
    }
    const newQuestion: Omit<Question, 'id'> = {
      question: currentQuestion, options: options.filter(Boolean), correctAnswer, points: Number(points),
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestion(''); setOptions(['', '', '', '']); setCorrectAnswer(''); setPoints('');
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle || !timeLimit || !department || questions.length === 0) {
      toast({ variant: 'destructive', title: 'Incomplete Test', description: 'Please provide a title, time limit, department, and at least one question.' });
      return;
    }
    setIsUploading(true);
    const testData = { title: testTitle, timeLimit: Number(timeLimit), department, questions };
    try {
      const response = await fetch('/api/admin/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testData) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create test.');
      toast({ title: 'Test Created Successfully', description: `Test "${testTitle}" has been created.` });
      setTestTitle(''); setTimeLimit(''); setDepartment(''); setQuestions([]);
      await fetchTests(); // Refresh the list of tests
    } catch (error) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteClick = (id: string, type: 'result' | 'test') => {
    setItemToDelete({ id, type });
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const { id, type } = itemToDelete;
    const url = type === 'result' ? `/api/admin/results/${id}` : `/api/admin/tests/${id}`;
    
    try {
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to delete ${type}.`);
      
      toast({ title: 'Success', description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.` });
      
      if (type === 'result') {
        setResults(prev => prev.filter(r => r._id !== id));
      } else {
        await fetchTests();
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const renderResultsContent = () => {
    if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading results...</span></div>;
    if (error) return <div className="flex flex-col items-center justify-center p-8 text-destructive"><AlertCircle className="h-8 w-8 mb-2" /><p>Error loading data: {error}</p></div>;
    if (results.length === 0) return <div className="flex flex-col items-center justify-center p-8 text-muted-foreground"><ListOrdered className="h-8 w-8 mb-2" /><p>No test results have been submitted yet.</p></div>;
    return (
      <>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search by user, test title, or department..." className="w-full rounded-lg bg-background pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Test Title</TableHead><TableHead>Department</TableHead><TableHead>Score</TableHead><TableHead>Date</TableHead><TableHead>Details</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result._id}>
                  <TableCell>{result.firstName} {result.lastName}</TableCell>
                  <TableCell>{result.testTitle}</TableCell>
                  <TableCell>{result.department}</TableCell>
                  <TableCell>{result.score}/{result.totalPoints}</TableCell>
                  <TableCell>{format(new Date(result.submittedAt), 'PPp')}</TableCell>
                  <TableCell><Button asChild variant="outline" size="sm"><Link href={`/results/${result._id}?department=${result.department}&firstName=${result.firstName}&lastName=${result.lastName}`} target="_blank">View <ExternalLink className="ml-2 h-3 w-3" /></Link></Button></TableCell>
                  <TableCell><Button variant="destructive" size="icon" onClick={() => handleDeleteClick(result._id, 'result')}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  const renderManageTestsContent = () => {
    if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading tests...</span></div>;
    if (error) return <div className="flex flex-col items-center justify-center p-8 text-destructive"><AlertCircle className="h-8 w-8 mb-2" /><p>Error loading data: {error}</p></div>;
    if (Object.keys(allTests).length === 0) return <div className="flex flex-col items-center justify-center p-8 text-muted-foreground"><FileCog className="h-8 w-8 mb-2" /><p>No tests have been created yet.</p></div>;

    return (
      <div className="space-y-6">
        {Object.entries(allTests).map(([dept, testsInDept]) => (
          testsInDept.length > 0 && (
            <div key={dept}>
              <h3 className="text-lg font-semibold mb-2">{dept}</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow><TableHead>Test Title</TableHead><TableHead>Questions</TableHead><TableHead>Time Limit</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {testsInDept.map(test => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{test.questions.length}</TableCell>
                        <TableCell>{test.timeLimit} min</TableCell>
                        <TableCell><Button variant="destructive" size="icon" onClick={() => handleDeleteClick(test.id, 'test')}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <>
    <Tabs defaultValue="results" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="results"><ListOrdered className="mr-2" /> View Results</TabsTrigger>
        <TabsTrigger value="create"><Upload className="mr-2" /> Create Test</TabsTrigger>
        <TabsTrigger value="manage"><FileCog className="mr-2" /> Manage Tests</TabsTrigger>
      </TabsList>
      <TabsContent value="results">
        <Card>
          <CardHeader><CardTitle>User Test Results</CardTitle><CardDescription>A summary of all tests taken by users. Search, view, or delete results.</CardDescription></CardHeader>
          <CardContent>{renderResultsContent()}</CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="create">
        <Card>
          <CardHeader><CardTitle>Create New Test</CardTitle><CardDescription>Build a new test by providing its details and adding questions one by one.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTest} className="space-y-8">
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Test Details</h3>
                <div className="space-y-2"><Label htmlFor="title">Test Title</Label><Input id="title" value={testTitle} onChange={e => setTestTitle(e.target.value)} type="text" placeholder="e.g., General Knowledge Quiz" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="timeLimit">Time Limit (minutes)</Label><Input id="timeLimit" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} type="number" placeholder="e.g., 30" required /></div>
                  <div className="space-y-2"><Label htmlFor="department">Department</Label><Select name="department" required value={department} onValueChange={(value) => setDepartment(value as Department)}><SelectTrigger id="department"><SelectValue placeholder="Assign to a department" /></SelectTrigger><SelectContent>{departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}</SelectContent></Select></div>
                </div>
              </div>
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Add a Question</h3>
                <div className="space-y-2"><Label htmlFor="question">Question Text</Label><Input id="question" value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} placeholder="What is the capital of France?" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{options.map((opt, index) => (<div className="space-y-2" key={index}><Label htmlFor={`option-${index}`}>Option {index + 1}</Label><Input id={`option-${index}`} value={opt} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} /></div>))}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="correctAnswer">Correct Answer</Label><Select value={correctAnswer} onValueChange={setCorrectAnswer}><SelectTrigger id="correctAnswer"><SelectValue placeholder="Select the correct answer" /></SelectTrigger><SelectContent>{options.filter(Boolean).map((opt, index) => (<SelectItem key={index} value={opt}>{opt}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="points">Points</Label><Input id="points" value={points} onChange={e => setPoints(e.target.value)} type="number" placeholder="e.g., 10" /></div>
                </div>
                <Button type="button" variant="outline" onClick={handleAddQuestion}><PlusCircle className="mr-2" /> Add Question to Test</Button>
              </div>
              {questions.length > 0 && (<div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-medium">Test Questions ({questions.length})</h3><div className="space-y-4">{questions.map((q, index) => (<div key={index} className="flex items-start justify-between p-3 border rounded-md bg-secondary/50"><div><p className="font-semibold">{index + 1}. {q.question}</p><p className="text-sm text-muted-foreground">Options: {q.options.join(', ')}</p><p className="text-sm text-green-600">Correct: {q.correctAnswer} ({q.points} pts)</p></div><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveQuestion(index)}><Trash2 className="h-4 w-4" /></Button></div>))}</div></div>)}
              <Button type="submit" disabled={isUploading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full text-base">{isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Test...</>) : (<><Upload className="mr-2" /> Create & Save Test</>)}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="manage">
        <Card>
          <CardHeader><CardTitle>Manage Existing Tests (KRTs)</CardTitle><CardDescription>View and delete tests that have been created for each department.</CardDescription></CardHeader>
          <CardContent>{renderManageTestsContent()}</CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the {itemToDelete?.type} and all of its data from the server.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
