'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                await signUp.email({
                    email,
                    password,
                    name,
                    callbackURL: "/dashboard",
                    fetchOptions: {
                        onResponse: () => {
                            setLoading(false);
                        },
                        onRequest: () => {
                            setLoading(true);
                        },
                        onError: (ctx: any) => {
                            setError(ctx.error.message);
                            setLoading(false);
                        },
                        onSuccess: async () => {
                            router.push("/dashboard");
                        }
                    }
                });
            } else {
                await signIn.email({
                    email,
                    password,
                    callbackURL: "/dashboard",
                    fetchOptions: {
                        onResponse: () => {
                            setLoading(false);
                        },
                        onRequest: () => {
                            setLoading(true);
                        },
                        onError: (ctx: any) => {
                            setError(ctx.error.message);
                            setLoading(false);
                        },
                        onSuccess: async () => {
                            router.push("/dashboard");
                        }
                    }
                });
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? 'Enter your details to create a new account'
                            : 'Enter your credentials to access your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="link"
                        className="w-full"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                    >
                        {isSignUp
                            ? 'Already have an account? Sign In'
                            : "Don't have an account? Sign Up"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}