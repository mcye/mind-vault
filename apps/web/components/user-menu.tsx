'use client';

import { useSession, signOut } from '@/lib/auth-client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserMenu() {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/login'); // 登出后跳回登录页
                },
            },
        });
    };

    if (isPending) return <Skeleton className="h-12 w-full rounded-md" />;
    if (!session) return null;

    return (
        <div className="border-t p-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-auto py-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user.image || ''} />
                            <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-sm">
                            <span className="font-medium truncate max-w-[120px]">{session.user.name}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {session.user.email}
                            </span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}