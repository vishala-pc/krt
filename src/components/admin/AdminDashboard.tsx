'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { TestResult } from '@/lib/types';
import { Upload, ListOrdered, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';


export default function AdminDashboard() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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


  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      // In a real app, you'd parse the Excel file here.
      // For now, we'll just show a success toast.
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Test Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result._id}>
              <TableCell>{result.userId}</TableCell>
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
    );
  }

  return (
    <Tabs defaultValue="results" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="results"><ListOrdered className="mr-2" /> View Results</TabsTrigger>
        <TabsTrigger value="upload"><Upload className="mr-2" /> Upload Questions</TabsTrigger>
      </TabsList>
      <TabsContent value="results">
        <Card>
          <CardHeader>
            <CardTitle>User Test Results</CardTitle>
            <CardDescription>A summary of all tests taken by users.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderResultsContent()}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Upload Question Paper</CardTitle>
            <CardDescription>Upload an Excel file with questions. Columns should be: Question, Option A, Option B, Option C, Option D, Answer, Point.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Excel File</Label>
                <Input id="file" type="file" accept=".xlsx, .xls, .csv" />
              </div>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="mr-2" /> Upload File
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
