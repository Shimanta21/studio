'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-context';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const { signIn, isLoading, appInitialized } = useApp();
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setAuthError(null);
    try {
      await signIn(values.email, values.password);
      toast({ title: 'Login Successful', description: "Welcome back!" });
    } catch (error: any) {
      let message = 'An unknown error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
            message = 'Invalid email or password.';
            break;
          default:
            message = 'Failed to authenticate. Please try again.';
        }
      }
      setAuthError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="h-12 w-auto mx-auto mb-4" />
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to manage your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !appInitialized}>
                {(form.formState.isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-center text-sm text-muted-foreground">
           <p>Please use the credentials created in the Firebase Console to sign in.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
