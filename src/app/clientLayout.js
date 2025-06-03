
'use client';
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ClientLayout({ children, initialSession }) {
    // This will update when client-side auth state changes
    const { data: session } = useSession();

    // Use the client session if available, otherwise fall back to initial server session
    const currentSession = session || initialSession;

    useEffect(() => {
        // Function to prevent zooming on input focus for iOS
        const preventIosZoom = () => {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('focusin', function() {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                    }
                });
                input.addEventListener('focusout', function() {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes');
                    }
                });
            });
        };

        // Apply the prevention only on iOS devices
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            preventIosZoom();
        }
    }, []);

    return (
        <>
            {!currentSession ? (
                // Public view: Use Header and Footer
                <>
                    <Header />
                    <main className="font-accent bg-primary-900">
                        {children}
                    </main>
                    <Footer />
                </>
            ) : (
                // Logged-in view: No Header or Footer
                <main className="font-accent bg-primary-900">
                    {children}
                </main>
            )}
            <Toaster />
        </>
    );
}
