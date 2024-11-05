import { Link, router, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@c/ThemedText';
import { ThemedView } from '@c/ThemedView';
import { useEffect } from 'react';

export default function NotFoundScreen() {
  
  useEffect(() => {
    setTimeout(() => {
      router.replace('/home/');
    }, 0);
  });

  return (
    null
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
