import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ActowizLogo from './ActowizLogo';

export default function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
           <ActowizLogo className="h-8" />
          <span className="font-bold text-xl font-headline text-primary">KRT {isAdmin && <span className="text-sm font-normal text-muted-foreground">Admin</span>}</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Logout</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
