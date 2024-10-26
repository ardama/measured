import { signInRequest, signUpRequest } from '@s/authReducer';
import { useAuthState, useAuthError, useAuthLoading } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Icon, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useAuthState();


  const handleSubmit = () => {
    const action = isSignUp ? signUpRequest : signInRequest;
    dispatch(action({ email, password }));
  }

  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* <Text style={styles.logoTitle} variant='headlineLarge'>
          Habit Tracker
        </Text> */}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} variant='headlineSmall'>
          {isSignUp ? 'Create an account' : 'Log in to your account'}
        </Text>
        <Text style={styles.subtitle} variant='bodyLarge'>
          {isSignUp ? 'Start tracking your habits now.' : 'Continue tracking your habits.'}
        </Text>
        <View style={styles.formContainer}>
          {/* <Text style={styles.inputLabel} variant='bodyMedium'>
            Email
          </Text> */}
          <TextInput
            value={email}
            mode='outlined'
            style={styles.input}          
            placeholder='Email'
            placeholderTextColor={theme.colors.outline}
            onChangeText={(text) => setEmail(text) }
            left={<TextInput.Icon tabIndex={-1} icon={'at'} rippleColor={'transparent'} />}
            onKeyPress={(e) => { if (e.nativeEvent.key === 'Enter') handleSubmit(); }}
          />
          {/* <Text style={styles.inputLabel} variant='bodyMedium'>
            Password
          </Text> */}
          <TextInput
            value={password}
            mode='outlined'
            style={styles.input}          
            placeholder={isSignUp ? 'New password' : 'Password'}
            placeholderTextColor={theme.colors.outline}
            onChangeText={(text) => setPassword(text) }
            secureTextEntry
            left={<TextInput.Icon tabIndex={-1} icon={'lock-outline'} rippleColor={'transparent'} />}
            onKeyPress={(e) => { if (e.nativeEvent.key === 'Enter') handleSubmit(); }}
          />
          {isSignUp && (
            <>
              {/* <Text style={styles.inputLabel} variant='bodyMedium'>
                Confirm password
              </Text> */}
              <TextInput
                value={passwordConfirmation}
                mode='outlined'
                style={styles.input}          
                placeholder='Confirm password'
                placeholderTextColor={theme.colors.outline}
                onChangeText={(text) => setPasswordConfirmation(text) }
                secureTextEntry
                left={<TextInput.Icon tabIndex={-1} icon={'lock-outline'} rippleColor={'transparent'} />}
                onKeyPress={(e) => { if (e.nativeEvent.key === 'Enter') handleSubmit(); }}
              />
            </>
          )}
          {error && <HelperText style={styles.error} type="error">{error}</HelperText>}
        </View>
        <Button
          style={styles.button}
          mode="contained"
          disabled={!email || !password || (isSignUp && password !== passwordConfirmation)}
          loading={loading}
          onPress={handleSubmit}
        >
          {isSignUp ? 'Sign Up' : 'Login'}
        </Button>
        <Button onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
          {isSignUp ? 'Already have an account? Log in' : 'Don\'t have an account? Sign Up'}
        </Button>
      </View>
    </View>
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

export default withAuth(LoginScreen, false);