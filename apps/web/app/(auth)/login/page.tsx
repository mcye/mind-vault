'use client';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const handleGithubLogin = () => {
        // 直接跳转到 API，让整个 OAuth 流程在同一个导航中完成，避免跨站 cookie 问题
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const callbackURL = encodeURIComponent("https://mind-vault-lyart.vercel.app/dashboard");
        window.location.href = `${apiUrl}/api/auth/sign-in/social?provider=github&callbackURL=${callbackURL}`;
    };

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="p-8 border rounded-lg shadow-sm text-center">
                <h1 className="text-2xl font-bold mb-4">Welcome to Memora</h1>
                <Button onClick={handleGithubLogin}>
                    Sign in with GitHub
                </Button>
            </div>
        </div>
    );
}