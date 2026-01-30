'use client';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const handleGithubLogin = async () => {
        await signIn.social({
            provider: "github",
            callbackURL: "https://mind-vault-lyart.vercel.app//dashboard", // 登录成功回首页 (必须是绝对路径，否则可能会跳到 API 域名)
        });
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