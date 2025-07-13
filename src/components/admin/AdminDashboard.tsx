'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, ListOrdered } from 'lucide-react';

const mockResults = [
  { id: 1, user: 'Alice', test: 'General Knowledge', score: '45/55', date: '2023-10-26' },
  { id: 2, user: 'Bob', test: 'React Fundamentals', score: '80/100', date: '2023-10-25' },
  { id: 3, user: 'Charlie', test: 'General Knowledge', score: '35/55', date: '2023-10-26' },
  { id: 4, user: 'Diana', test: 'Advanced JavaScript', score: '95/100', date: '2023-10-24' },
];

export default function AdminDashboard() {
  const { toast } = useToast();

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

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload"><Upload className="mr-2" /> Upload Questions</TabsTrigger>
        <TabsTrigger value="results"><ListOrdered className="mr-2" /> View Results</TabsTrigger>
      </TabsList>
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
      <TabsContent value="results">
        <Card>
          <CardHeader>
            <CardTitle>User Test Results</CardTitle>
            <CardDescription>A summary of all tests taken by users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Test Title</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.user}</TableCell>
                    <TableCell>{result.test}</TableCell>
                    <TableCell>{result.score}</TableCell>
                    <TableCell>{result.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
