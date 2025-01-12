import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@u/hooks/useAuth';

let isRouting = false;
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
        if (requireUser && !userExists && !isRouting) {
          isRouting = true;
          router.navigate('/auth');
          setTimeout(() => {
            isRouting = false;
          }, 50);
        } else if (!requireUser && userExists && !isRouting) {
          isRouting = true;
          router.navigate('/');
          setTimeout(() => {
            isRouting = false;
          }, 50);
        }
      }, 0)
    }, [userExists]);

    return <WrappedComponent {...props} />;
  };
}