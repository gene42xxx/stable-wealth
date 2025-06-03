// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // --- Allow specific routes early ---
    // Allow the verification route called by admin dashboard to pass through middleware checks here
    // (The API route itself performs necessary session checks)
    if (pathname === '/api/investor/wallet/verify-transactions') {
        return NextResponse.next();
    }

    // Define protected routes patterns
    const adminRoutes = ['/admin', '/api/admin']; // Protects /admin/* and /api/admin/*
    const userProtectedRoutes = [
        '/investor',     // Protects /investor/* (dashboard, settings, etc.)
        '/api/investor', // Protects /api/investor/*
        '/api/wallet',   // Protects /api/wallet/*
        // Removed /api/subscription - handled by specific admin/investor routes
    ];
    // Routes only unauthenticated users should access (or be redirected from if authenticated)
    const publicOnlyRoutes = [
        '/',
        '/contact',
        '/about',
        '/investment',
        '/auth/signin',
        '/auth/signup'
        // Add other public-only pages like /faq if needed
    ];

    // Check if path is an admin route
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // Check if path is a protected user route (investor area, wallet api, etc.)
    const isUserProtectedRoute = userProtectedRoutes.some(route => pathname.startsWith(route));

    // Check if path is a public-only route (more precise check)
    const isPublicOnlyRoute = publicOnlyRoutes.some(route => {
        if (route === '/') return pathname === '/'; // Exact match for root
        // Check if pathname starts with the route AND the next char is '/' or end of string
        // This prevents '/about-us' matching '/about' incorrectly if '/about-us' wasn't public
        return pathname.startsWith(route) && (pathname.length === route.length || pathname[route.length] === '/');
    });

    // --- Logic Order Matters ---
    // 1. Handle Admin Routes first (most specific)
    if (isAdminRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/signin', request.url));
        }

        if (token.role !== 'admin' && token.role !== 'super-admin') {
            return NextResponse.redirect(new URL('/investor/dashboard', request.url));
        }

        return NextResponse.next(); // Allow access for admins
    }

    // 2. Handle Public-Only Routes for Logged-In Users
    if (isPublicOnlyRoute && token) {
        // Redirect logged-in users away from public-only pages to their dashboard
        const targetDashboard = (token.role === 'admin' || token.role === 'super-admin') ? '/admin/dashboard' : '/investor/dashboard';
        // *** Add check: Only redirect if NOT already on the target dashboard ***
        if (pathname !== targetDashboard) {
            return NextResponse.redirect(new URL(targetDashboard, request.url));
        }
    }

    // 3. Handle Protected User Routes (Investor, Wallet, etc.)
    if (isUserProtectedRoute) {
        // If not logged in, redirect to signin
        if (!token) {
            return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), request.url)); // Encode callbackUrl
        }
        // If logged in but NOT a 'user', redirect away (e.g., to admin dashboard or generic dashboard)
        if (token.role !== 'user') {
            // Determine appropriate redirect based on actual role
            const targetDashboard = (token.role === 'admin' || token.role === 'super-admin') ? '/admin/dashboard' : '/dashboard'; // Redirect non-users away
            return NextResponse.redirect(new URL(targetDashboard, request.url));
        }
        // If logged in AND is a 'user', allow access
        return NextResponse.next();
    }

    // 4. Handle Public-Only Routes for Logged-In Users (Moved after protected routes)
    if (isPublicOnlyRoute && token) {
        // Redirect logged-in users away from public-only pages to their dashboard
        const targetDashboard = (token.role === 'admin' || token.role === 'super-admin') ? '/admin/dashboard' : '/investor/dashboard';
        // Only redirect if NOT already on the target dashboard
        if (pathname !== targetDashboard) {
            return NextResponse.redirect(new URL(targetDashboard, request.url));
        }
    }


    // 5. Default: Allow access to all other routes (public routes for logged-out users, etc.)
    return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
    /* // Original Matcher commented out for debugging - Restoring original */
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/auth|api/public|.*\\.\\w+).*)',
        '/api/admin/:path*',
        '/api/wallet/:path*',
        '/api/subscription/:path*',
        '/api/activity', // Keep explicitly included
    ],
};
