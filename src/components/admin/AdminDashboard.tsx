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
import { Upload, ListOrdered, Loader2, AlertCircle, Search, PlusCircle, Trash2, FileCog, Users, FileUp, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
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
import * as XLSX from 'xlsx';
import ResultDetails from './ResultDetails';

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  department: Department;
  testsTaken: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [allTests, setAllTests] = useState<Record<string, Test[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'result' | 'test'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [testTitle, setTestTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState('');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvTestTitle, setCsvTestTitle] = useState('');
  const [csvTimeLimit, setCsvTimeLimit] = useState('');
  const [csvDepartment, setCsvDepartment] = useState<Department | ''>('');

  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  
  const departments: Department[] = [
    'Python Developer', 'R&D', 'Sales', 'Marketing', 'Project Coordinators', 'QA', 'Delivery Manager', 'IT', 'General'
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
  
  const userSummaries = useMemo<UserSummary[]>(() => {
    const userMap = new Map<string, UserSummary>();
    results.forEach(result => {
      if (!result.userId) return;
      if (userMap.has(result.userId)) {
        const existingUser = userMap.get(result.userId)!;
        existingUser.testsTaken += 1;
      } else {
        userMap.set(result.userId, {
            id: result.userId,
            firstName: result.firstName,
            lastName: result.lastName,
            department: result.department,
            testsTaken: 1,
        });
      }
    });
    return Array.from(userMap.values());
  }, [results]);

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

  const createTest = async (testData: { title: string, timeLimit: number, department: Department, questions: Omit<Question, 'id'>[] }) => {
    setIsUploading(true);
    try {
      const response = await fetch('/api/admin/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testData) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create test.');
      toast({ title: 'Test Created Successfully', description: `Test "${testData.title}" has been created.` });
      await fetchTests();
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTestManually = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle || !timeLimit || !department || questions.length === 0) {
      toast({ variant: 'destructive', title: 'Incomplete Test', description: 'Please provide a title, time limit, department, and at least one question.' });
      return;
    }
    const success = await createTest({ title: testTitle, timeLimit: Number(timeLimit), department, questions });
    if (success) {
      setTestTitle(''); setTimeLimit(''); setDepartment(''); setQuestions([]);
    }
  };

  const handleCreateTestFromCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTestTitle || !csvTimeLimit || !csvDepartment || !csvFile) {
        toast({ variant: 'destructive', title: 'Incomplete Form', description: 'Please provide a title, time limit, department, and a CSV file.' });
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            const csvQuestions: Omit<Question, 'id'>[] = json.map(row => {
                const { Questions, A, B, C, D, Answer, point } = row;
                if (!Questions || !A || !B || !C || !D || !Answer || point === undefined) {
                    throw new Error('CSV file has missing columns. Required: Questions, A, B, C, D, Answer, point');
                }
                return {
                    question: String(Questions),
                    options: [String(A), String(B), String(C), String(D)],
                    correctAnswer: String(Answer),
                    points: Number(point)
                };
            });
            
            if (csvQuestions.length === 0) {
                throw new Error("CSV file doesn't contain any questions.");
            }

            const success = await createTest({
                title: csvTestTitle,
                timeLimit: Number(csvTimeLimit),
                department: csvDepartment,
                questions: csvQuestions
            });

            if (success) {
                setCsvTestTitle('');
                setCsvTimeLimit('');
                setCsvDepartment('');
                setCsvFile(null);
                const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'CSV Processing Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
            setIsUploading(false);
        }
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
        setIsUploading(false);
    };
    reader.readAsArrayBuffer(csvFile);
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

  const allTestsFlat = useMemo(() => Object.values(allTests).flat(), [allTests]);

  const renderResultsContent = () => {
    if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading results...</span></div>;
    if (error) return <div className="flex flex-col items-center justify-center p-8 text-destructive"><AlertCircle className="h-8 w-8 mb-2" /><p>Error loading data: {error}</p></div>;
    if (results.length === 0) return <div className="flex flex-col items-center justify-center p-8 text-muted-foreground"><ListOrdered className="h-8 w-8 mb-2" /><p>No test results have been submitted yet.</p></div>;
    
    return (
      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedResult(null)}>
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
                  <TableCell>
                     <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedResult(result)}>
                            View <Eye className="ml-2 h-3 w-3" />
                        </Button>
                    </DialogTrigger>
                  </TableCell>
                  <TableCell><Button variant="destructive" size="icon" onClick={() => handleDeleteClick(result._id, 'result')}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selectedResult && (
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Test Result Details</DialogTitle>
                    <DialogDescription>
                        Showing results for {selectedResult.testTitle} submitted by {selectedResult.firstName} {selectedResult.lastName}.
                    </DialogDescription>
                </DialogHeader>
                <ResultDetails result={selectedResult} test={allTestsFlat.find(t => t.id === selectedResult.testId) || null} />
            </DialogContent>
        )}
      </Dialog>
    );
  }

  const renderManageTestsContent = () => {
    if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading tests...</span></div>;
    if (error) return <div className="flex flex-col items-center justify-center p-8 text-destructive"><AlertCircle className="h-8 w-8 mb-2" /><p>Error loading data: {error}</p></div>;
    if (Object.keys(allTests).length === 0) return <div className="flex flex-col items-center justify-center p-8 text-muted-foreground"><FileCog className="h-8 w-8 mb-2" /><p>No tests have been created yet.</p></div>;

    return (
      <div className="space-y-6">
        {Object.entries(allTests).map(([dept, testsInDept]) => {
           const seenIds = new Set();
           const uniqueTests = testsInDept.filter(test => {
                if (!test || !test.id) return false;
                if (seenIds.has(test.id)) {
                    return false;
                } else {
                    seenIds.add(test.id);
                    return true;
                }
           });

          return uniqueTests.length > 0 && (
            <div key={dept}>
              <h3 className="text-lg font-semibold mb-2">{dept}</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow><TableHead>Test Title</TableHead><TableHead>Questions</TableHead><TableHead>Time Limit</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {uniqueTests.map(test => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{test.questions?.length ?? 0}</TableCell>
                        <TableCell>{test.timeLimit} min</TableCell>
                        <TableCell><Button variant="destructive" size="icon" onClick={() => handleDeleteClick(test.id, 'test')}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        })}
      </div>
    );
  };
  
  const renderUsersContent = () => {
    if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading users...</span></div>;
    if (error) return <div className="flex flex-col items-center justify-center p-8 text-destructive"><AlertCircle className="h-8 w-8 mb-2" /><p>Error loading user data: {error}</p></div>;
    if (userSummaries.length === 0) return <div className="flex flex-col items-center justify-center p-8 text-muted-foreground"><Users className="h-8 w-8 mb-2" /><p>No users have taken any tests yet.</p></div>;
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Tests Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSummaries.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell className="text-right">{user.testsTaken}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };


  return (
    <>
    <Tabs defaultValue="results" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="results"><ListOrdered className="mr-2" /> View Results</TabsTrigger>
        <TabsTrigger value="create-csv"><FileUp className="mr-2" /> Create from CSV</TabsTrigger>
        <TabsTrigger value="create-manual"><PlusCircle className="mr-2" /> Create Manually</TabsTrigger>
        <TabsTrigger value="manage"><FileCog className="mr-2" /> Manage Tests</TabsTrigger>
        <TabsTrigger value="users"><Users className="mr-2" /> Users</TabsTrigger>
      </TabsList>
      <TabsContent value="results">
        <Card>
          <CardHeader><CardTitle>User Test Results</CardTitle><CardDescription>A summary of all tests taken by users. Search, view, or delete results.</CardDescription></CardHeader>
          <CardContent>{renderResultsContent()}</CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="create-csv">
        <Card>
          <CardHeader>
            <CardTitle>Create Test from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file to quickly generate a new test. The file must have columns: Questions,A,B,C,D,Answer,point
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTestFromCSV} className="space-y-6">
              <div className="space-y-2"><Label htmlFor="csv-title">Test Title</Label><Input id="csv-title" value={csvTestTitle} onChange={e => setCsvTestTitle(e.target.value)} placeholder="e.g., Advanced Python Quiz" required /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="csv-timeLimit">Time Limit (minutes)</Label><Input id="csv-timeLimit" value={csvTimeLimit} onChange={e => setCsvTimeLimit(e.target.value)} type="number" placeholder="e.g., 60" required /></div>
                <div className="space-y-2"><Label htmlFor="csv-department">Department</Label><Select name="csv-department" required value={csvDepartment} onValueChange={(value) => setCsvDepartment(value as Department)}><SelectTrigger id="csv-department"><SelectValue placeholder="Assign to a department" /></SelectTrigger><SelectContent>{departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="csv-file">CSV File</Label><Input id="csv-file-input" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)} required /></div>
              <Button type="submit" disabled={isUploading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full text-base">{isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Test...</>) : (<><Upload className="mr-2" /> Upload & Create Test</>)}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="create-manual">
        <Card>
          <CardHeader><CardTitle>Create New Test Manually</CardTitle><CardDescription>Build a new test by providing its details and adding questions one by one.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTestManually} className="space-y-8">
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
      <TabsContent value="users">
        <Card>
          <CardHeader><CardTitle>User Details</CardTitle><CardDescription>A list of all users who have completed at least one test.</CardDescription></CardHeader>
          <CardContent>{renderUsersContent()}</CardContent>
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
