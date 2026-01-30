import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. 定义不需要鉴权的公开路由
    const isPublicRoute =
        path === "/login" ||
        path === "/register" ||
        path.startsWith("/api/auth") || // Auth 接口必须公开
        path.startsWith("/images") ||   // 静态资源
        path.startsWith("/_next");      // Next.js 内部资源

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // 2. 检查 Session Cookie
    // Better-Auth 默认的 cookie 名通常是 "better-auth.session_token"
    // 如果你在 better-auth 配置了 prefix，这里要对应修改
    const sessionToken = request.cookies.get("better-auth.session_token")?.value ||
        request.cookies.get("__Secure-better-auth.session_token")?.value;

    // 3. 未登录 -> 跳转登录页
    if (!sessionToken) {
        const url = new URL("/login", request.url);
        // 记录用户原本想去的页面，登录后跳回来 (可选优化)
        url.searchParams.set("callbackUrl", path);
        return NextResponse.redirect(url);
    }

    // 4. 已登录但访问登录页 -> 跳转首页 (可选)
    if (sessionToken && (path === "/login" || path === "/register")) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

// 配置匹配规则，避免拦截静态文件以提高性能
export const config = {
    matcher: [
        /*
         * 匹配所有路径，除了:
         * - api/auth (auth 接口)
         * - _next/static (静态文件)
         * - _next/image (图片优化)
         * - favicon.ico, sitemap.xml 等
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};