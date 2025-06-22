
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, KeyRound, LogIn, UserPlus, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});
type LoginInput = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});
type SignupInput = z.infer<typeof signupSchema>;

// Simple Google SVG Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
    <path
      fill="#4285F4"
      d="M21.35 12.08c0-.79-.07-1.55-.2-2.29H12v4.35h5.24c-.22 1.41-.86 2.63-1.85 3.44v2.79h3.58c2.09-1.93 3.3-4.78 3.3-8.29z"
    />
    <path
      fill="#34A853"
      d="M12 22c3.24 0 5.95-1.07 7.92-2.9l-3.58-2.79c-1.07.72-2.43 1.15-4.34 1.15-3.33 0-6.15-2.24-7.15-5.26H1.24v2.88C3.21 19.38 7.27 22 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M4.85 14.28c-.24-.72-.37-1.49-.37-2.28s.13-1.56.37-2.28V6.84H1.24C.46 8.35 0 10.12 0 12s.46 3.65 1.24 5.16l3.61-2.88z"
    />
    <path
      fill="#EA4335"
      d="M12 4.84c1.77 0 3.35.61 4.62 1.83l3.13-3.13C17.95.83 15.24 0 12 0 7.27 0 3.21 2.62 1.24 6.84l3.61 2.88C5.85 7.08 8.67 4.84 12 4.84z"
    />
  </svg>
);


export default function AuthForm() {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if user is logged in. This is a side-effect and should be in useEffect.
    // This also acts as a fallback for the redirect logic in AuthContext.
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const handleLogin: SubmitHandler<LoginInput> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user);
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Failed to login. Please check your credentials.');
    }
    setIsLoading(false);
  };

  const handleSignup: SubmitHandler<SignupInput> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user);
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Failed to sign up. Please try again.');
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Failed to sign in with Google. Please try again.');
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async () => {
    setError(null);
    const email = loginForm.getValues('email');
    const isEmailValid = await loginForm.trigger('email');

    if (!isEmailValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email to reset your password.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account for ${email} exists, a reset link has been sent.`,
      });
    } catch (e: any) {
      const friendlyError = 'Failed to send password reset email. Please try again.';
      setError(friendlyError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: friendlyError,
      });
    }
    setIsLoading(false);
  };
  
  if (user) {
     return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-xl text-muted-foreground">Redirecting...</p>
        </div>
     );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl font-bold font-headline text-primary">Welcome to PantryPal</CardTitle>
          <CardDescription>Sign in or create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password">Password</Label>
                   <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...loginForm.register('password')}
                    />
                  </div>
                  <div className="flex items-center text-sm">
                    {loginForm.formState.errors.password && (
                        <p className="text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 font-medium ml-auto"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Login
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-email">Email</Label>
                   <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...signupForm.register('email')}
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...signupForm.register('password')}
                    />
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                   <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...signupForm.register('confirmPassword')}
                    />
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading && activeTab === 'google' ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
