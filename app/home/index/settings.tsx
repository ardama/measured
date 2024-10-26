import { signInRequest, signUpRequest } from '@s/authReducer';
import { useAuthState, useAuthError, useAuthLoading } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Icon, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

const SettingsScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <>
      
    </>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
})

export default SettingsScreen;