import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@u/hooks/useAuth';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireAuth: boolean = true
) {
  return (props: P) => {
    const { loading, user } = useAuth();

    useEffect(() => {
      if (loading) return;

      setTimeout(() => {
        if (requireAuth && !user) {
          router.replace('/login');
        } else if (!requireAuth && user) {
          router.replace('/home/recordings');
        }
      }, 0)
    }, [user]);

    return <WrappedComponent {...props} />;
  };
}