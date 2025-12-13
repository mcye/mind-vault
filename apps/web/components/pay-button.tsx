import { type User } from "@repo/shared"
import { useState } from "react";
import { apiFetch, client } from "@/lib/rpc";

export const PayButton = ({ user }: { user: User }) => {
    const [isPaying, setIsPaying] = useState(false)
    const handleUpgrade = async () => {
        setIsPaying(true)
        try {
            // 1. 请求后端创建 Session
            const res = await apiFetch(client.pay.checkout.$post())

            if (res.url) {
                // 2. 跳转到 Stripe 托管页面
                window.location.href = res.url
            } else {
                alert('Failed to start checkout')
            }
        } catch (e) {
            console.error(e)
            alert('Something went wrong')
        }
        setIsPaying(false)
    }
    return user?.plan !== 'pro' && (
        <button
            onClick={handleUpgrade}
            disabled={isPaying}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 flex justify-center"
        >
            {isPaying ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
                "Upgrade to PRO ($20/mo)"
            )}
        </button>
    )
}