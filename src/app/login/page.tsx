'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { Department } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [department, setDepartment] = useState<Department | ''>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) {
        // You might want to show an error to the user here
        alert('Please select a department');
        return;
    }
    // In a real app, you'd handle authentication here
    router.push(`/dashboard?department=${encodeURIComponent(department)}`);
  };
  
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm shadow-xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-2">
                <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                 <Select name="department" required value={department} onValueChange={(value) => setDepartment(value as Department)}>
                    <SelectTrigger id="department">
                        <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Login</Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="underline hover:text-primary">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
