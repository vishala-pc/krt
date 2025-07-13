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
import type { TestResult, Department } from '@/lib/types';
import { Upload, ListOrdered, Loader2, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { format } from 'date-fns';


export default function AdminDashboard() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    return results.filter(result => 
      result.userName.toLowerCase().includes(lowercasedFilter) ||
      result.testTitle.toLowerCase().includes(lowercasedFilter) ||
      result.department.toLowerCase().includes(lowercasedFilter)
    );
  }, [results, searchTerm]);


  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      // In a real app, you'd parse the Excel file here and use the form fields.
      toast({
        title: 'Upload Successful',
        description: `File "${fileInput.files[0].name}" has been processed.`,
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Please select a file to upload.',
      });
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
                <TableCell>{result.userName}</TableCell>
                <TableCell>{result.testTitle}</TableCell>
                <TableCell>{result.department}</TableCell>
                <TableCell>{result.score}/{result.totalPoints}</TableCell>
                <TableCell>{format(new Date(result.submittedAt), 'PPp')}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                      <Link href={`/results/${result._id}`} target="_blank">View <ExternalLink className="ml-2 h-3 w-3" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
            <CardDescription>Upload an Excel file with questions and define the test parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="testTitle">Test Title</Label>
                <Input id="testTitle" type="text" placeholder="e.g., General Knowledge Quiz" required/>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input id="timeLimit" type="number" placeholder="e.g., 30" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                     <Select name="department" required>
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
              <div className="space-y-2">
                <Label htmlFor="file">Question File (Excel)</Label>
                <Input id="file" type="file" accept=".xlsx, .xls, .csv" required/>
                <p className="text-sm text-muted-foreground">Columns: Question, Option A, B, C, D, Answer, Point</p>
              </div>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="mr-2" /> Upload & Create Test
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
