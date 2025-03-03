import { sequence } from 'astro:middleware';
import { getSession } from '@auth/astro';

async function authMiddleware({ request, redirect, url }) {
    // Skip auth check for public routes and auth-related routes
    if (!url.pathname.startsWith('/admin') || 
        url.pathname === '/admin/login' ||
        url.pathname.startsWith('/api/auth')) {
        return;
    }

    const session = await getSession(request);
    
    // Redirect to login if no session
    if (!session) {
        return redirect('/admin/login');
    }

    // Check role-based access
    if (session.user.role !== 'admin') {
        return new Response('Unauthorized', { status: 403 });
    }
}

export const onRequest = sequence(authMiddleware);
