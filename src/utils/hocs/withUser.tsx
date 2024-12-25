import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@u/hooks/useAuth';

export function withUser<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireUser: boolean = true
) {
  return (props: P) => {
    const { loading, isAuthenticated, isGuest } = useAuth();
    const userExists = isAuthenticated || isGuest;

    useEffect(() => {
      if (loading) return;

      setTimeout(() => {
        if (requireUser && !userExists) {
          router.replace('/auth');
        } else if (!requireUser && userExists) {
          router.replace('/');
        }
      }, 0)
    }, [userExists]);

    return <WrappedComponent {...props} />;
  };
}