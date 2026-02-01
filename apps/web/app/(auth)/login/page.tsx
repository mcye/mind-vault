'use client';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const handleGithubLogin = async () => {
        await signIn.social({
            provider: "github",
            callbackURL: "https://mcye.online/dashboard", // 登录成功回首页 (必须是绝对路径，否则可能会跳到 API 域名)
        });
    };

    const handleGoogleLogin = async () => {
        await signIn.social({
            provider: "google",
            callbackURL: "https://mcye.online/dashboard",
        });
    };

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="p-8 border rounded-lg shadow-sm text-center w-[400px]">
                <h1 className="text-2xl font-bold mb-4">Welcome to Memora</h1>
                <div className="flex flex-col gap-4">
                    <Button onClick={handleGithubLogin} className="w-full">
                        Sign in with GitHub
                    </Button>
                    <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
                        Sign in with Google
                    </Button>
                </div>
            </div>
        </div>
    );
}