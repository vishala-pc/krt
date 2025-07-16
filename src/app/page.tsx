import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActowizLogo from '@/components/ActowizLogo';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <ActowizLogo className="w-48 h-auto" />
          </div>
          <CardTitle className="text-4xl font-headline font-bold text-primary pt-2">ExamLock</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Your Secure Online Testing Environment
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-8">
            Take knowledge retention tests in a focused, secure, and distraction-free environment.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-sm text-muted-foreground text-center">
        <p>Built for focus and integrity.</p>
        <Link href="/admin" className="underline hover:text-primary mt-2 inline-block">
          Admin Panel
        </Link>
      </footer>
    </div>
  );
}
