import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuth } from '@u/hooks/useAuth';
import LoadingScreen from '@c/Loading';

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
          router.replace('/auth/login');
        } else if (!requireAuth && user) {
          router.replace('/');
        }
      }, 0)
    }, [user]);

    return <WrappedComponent {...props} />;
  };
}