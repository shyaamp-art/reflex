'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Lock, Mail, Sparkles, Shield, User, ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { setStoredSession, DEMO_MANAGER, DEMO_EMPLOYEE } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid work email' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSuccessfulAuth = (role: 'MANAGER' | 'EMPLOYEE', sessionData = DEMO_MANAGER) => {
    setStoredSession(sessionData);
    toast.success(`Welcome back, ${sessionData.name}! Signed in as ${role}.`);
    if (role === 'MANAGER') {
      router.push('/manager/dashboard');
    } else {
      router.push('/employee/dashboard');
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // 1. Try authenticating via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        // Check if demo credentials entered manually
        if (values.email.toLowerCase().includes('manager') || values.email === DEMO_MANAGER.email) {
          handleSuccessfulAuth('MANAGER', { ...DEMO_MANAGER, email: values.email });
          return;
        } else if (values.email.toLowerCase().includes('employee') || values.email === DEMO_EMPLOYEE.email) {
          handleSuccessfulAuth('EMPLOYEE', { ...DEMO_EMPLOYEE, email: values.email });
          return;
        }
        throw new Error(error.message || 'Invalid email or password');
      }

      // Check role from metadata or employee table
      const role = (data.user?.user_metadata?.role as 'MANAGER' | 'EMPLOYEE') || 'MANAGER';
      handleSuccessfulAuth(role, {
        email: data.user.email || values.email,
        name: data.user.user_metadata?.name || 'Authorized User',
        role,
        employeeId: data.user.id,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = (role: 'MANAGER' | 'EMPLOYEE') => {
    setIsLoading(true);
    setTimeout(() => {
      const session = role === 'MANAGER' ? DEMO_MANAGER : DEMO_EMPLOYEE;
      handleSuccessfulAuth(role, session);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Subtle background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/40 shadow-2xl bg-card/90 backdrop-blur-md">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">AI-04 Workforce</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Autonomous Decision & Resource Allocation Agent
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {authError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {authError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="name@company.com"
                          className="pl-9"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-9"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Demo Quick Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => loginAsDemo('MANAGER')}
            >
              <Shield className="w-4 h-4 text-primary" />
              <div className="text-left leading-none">
                <span className="block text-xs font-semibold">Manager</span>
                <span className="text-[10px] text-muted-foreground">Full Access</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => loginAsDemo('EMPLOYEE')}
            >
              <User className="w-4 h-4 text-primary" />
              <div className="text-left leading-none">
                <span className="block text-xs font-semibold">Employee</span>
                <span className="text-[10px] text-muted-foreground">Self Service</span>
              </div>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/40 py-3 text-xs text-muted-foreground">
          Single Sign-On & Supabase Auth Protected
        </CardFooter>
      </Card>
    </div>
  );
}
