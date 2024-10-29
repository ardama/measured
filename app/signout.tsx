import LoadingScreen from '@c/Loading';
import { signInRequest, signOutRequest, signUpRequest } from '@s/authReducer';
import { useAuthState, useAuthError, useAuthLoading } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Icon, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

const SignoutScreen = () => {
  const dispatch = useDispatch();
  const signoutTriggered = useRef(false);
  useEffect(() => {
    if (signoutTriggered.current) return;

    setTimeout(() => {
      dispatch(signOutRequest());
    }, 500);
    signoutTriggered.current = true;
  })
  return (
    <LoadingScreen />
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
})

export default withAuth(SignoutScreen);