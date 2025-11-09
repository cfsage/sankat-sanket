'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '../icons';
import { LogOut, Settings, User, LogIn } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export default function AppHeader() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const ready = isSupabaseConfigured();
  const supabaseRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null);
  const supabase = useMemo(() => {
    if (!ready) return null;
    if (!supabaseRef.current) supabaseRef.current = getSupabaseClient();
    return supabaseRef.current;
  }, [ready]);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setUserEmail((data.user?.email as string | null) ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      setUserEmail((u?.email as string | null) ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      {isMobile && <SidebarTrigger />}
      
      <Link href="/dashboard" className="hidden items-center gap-2 md:flex">
        <Logo className="h-6 w-6 text-primary" />
        <span className="font-headline text-lg font-bold">Sankat Sanket</span>
      </Link>

      <div className="flex-1"></div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://picsum.photos/seed/avatar/100/100" alt="@user" />
              <AvatarFallback>SS</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userEmail ? userEmail : 'Guest'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userId ? userId : 'Not signed in'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {userId ? (
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign in</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
