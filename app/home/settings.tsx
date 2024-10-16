import { signInRequest, signUpRequest } from '@s/authReducer';
import { useAuthState, useAuthError, useAuthLoading } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Icon, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

const LoginScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <>
      SETTINGS
    </>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 28,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
  },
  logoContainer: {
  },
  logoTitle: {
    margin: 24,
    color: theme.colors.onSecondary,
  },
  content: {
    flexDirection: 'column',
    paddingVertical: 40,
    paddingHorizontal: 40,
    width: '100%',
    margin: 40,

    backgroundColor: theme.colors.surface,
    borderRadius: 24,

    shadowRadius: 16,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontWeight: 'bold',
    
  },
  subtitle: {
    color: theme.colors.outline,
    marginTop: 2,
  },
  formContainer: {
    marginVertical: 20,
  },
  input: {
    marginVertical: 8,
  },
  // inputLabel: {
  //   marginTop: 8,
    
  // },
  error: {
    marginTop: 0,
  },
  button: {
    marginTop: 12,
  },
  toggle: {
    marginTop: 8,
  },
})

export default LoginScreen;