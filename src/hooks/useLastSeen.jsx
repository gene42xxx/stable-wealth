// hooks/useLastSeen.js
import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { debounce } from 'lodash';

export function useLastSeen() {
    const { data: session } = useSession();

    const updateLastSeen = useCallback(
        debounce(async () => {
            if (session?.user) {
                await fetch('/api/investor/update-lastseen', { method: 'POST' });
            }
        }, 30000), // Update every 30 seconds max
        [session]
    );

    useEffect(() => {
        if (session?.user) {
            updateLastSeen();

            // Update on visibility change
            const handleVisibilityChange = () => {
                if (!document.hidden) {
                    updateLastSeen();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [session, updateLastSeen]);
}