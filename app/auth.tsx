import { resetRequest, signInRequest, signUpRequest, type AuthAction } from '@s/authReducer';
import { useAuthState, useAuthError, useAuthLoading } from '@s/selectors';
import { Error, EmptyError, NoError } from '@u/constants/Errors';
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
  const [userAction, setUserAction] = useState<AuthAction>('login');
  const isLogin = userAction === 'login';
  const isSignUp = userAction === 'signup';
  const isReset = userAction === 'reset'; 

  const [submitAttempted, setSubmitAttempted] = useState<AuthAction | null>(null);
  
  const dispatch = useDispatch();
  const { loading, error, info, action } = useAuthState();
  const lastestAction = submitAttempted || action;

  useEffect(() => {
    if (info) setUserAction('login');
  }, [info]);

  const getErrors = () => {
    let e = getEmailErrors();
    if (e.hasError) return e;
    
    e = getPasswordErrors();
    if (e.hasError) return e;
    
    e = getConfirmationErrors();
    if (e.hasError) return e;

    return NoError;
  }

  const getEmailErrors = () => {
    if (!email || !email.trim()) return Error('Email cannot be empty.'); 
    return NoError;
  }
  const getPasswordErrors = () => {
    if (isReset) return NoError;
    if (!password || !password.trim() || password.trim().length < 6) return Error('Password must be at least 6 characters.');
    return NoError;
  }

  const getConfirmationErrors = () => {
    if (isReset) return NoError;
    if (isLogin) return NoError;
    if (password !== passwordConfirmation) return Error('Password confirmation must match.');
    return NoError;
  }

  const handleSubmit = () => {
    if (getErrors().hasError) {
      setSubmitAttempted(userAction);
      return;
    }

    if (isLogin) dispatch(signInRequest({ email, password }));
    else if (isSignUp) dispatch(signUpRequest({ email, password }));
    else if (isReset) dispatch(resetRequest({ email }));
  }

  const errorText = getErrors().hasError ? getErrors().msg : `Error: ${error}`;

  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoTitle} variant='headlineLarge'>
          M
        </Text>
        <Text style={styles.logoTitle} variant='headlineSmall'>
          345URED
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title} variant='titleLarge'>
            {isSignUp ? 'Create an account' : isLogin ? 'Log in to your account' : 'Reset password'}
          </Text>
          <Text style={styles.subtitle} variant='bodyLarge'>
            {isSignUp ? 'Start meauring your life.' : isLogin ? 'Continue measuring your life.' : 'Enter your email to receive a password reset link.'}
          </Text>
          <TextInput
            value={email}
            mode='outlined'
            style={styles.input}          
            placeholder='Email'
            placeholderTextColor={theme.colors.outline}
            error={lastestAction === userAction && getEmailErrors().hasError}
            onChangeText={(text) => setEmail(text) }
            left={<TextInput.Icon tabIndex={-1} icon={'at'} rippleColor={'transparent'} />}
            onKeyPress={(e) => { if (e.nativeEvent.key === 'Enter') handleSubmit(); }}
          />
          {isReset ? null : <TextInput
            value={password}
            mode='outlined'
            style={styles.input}          
            placeholder={isSignUp ? 'New password' : 'Password'}
            placeholderTextColor={theme.colors.outline}
            error={lastestAction === userAction && getPasswordErrors().hasError}
            onChangeText={(text) => setPassword(text) }
            secureTextEntry
            left={<TextInput.Icon tabIndex={-1} icon={'lock-outline'} rippleColor={'transparent'} />}
            onKeyPress={(e) => { if (e.nativeEvent.key === 'Enter') handleSubmit(); }}
          />}
          {isSignUp && (
            <>
              <TextInput
                value={passwordConfirmation}
                mode='outlined'
                style={styles.input}          
                placeholder='Confirm password'
                placeholderTextColor={theme.colors.outline}
                error={lastestAction === userAction && getConfirmationErrors().hasError}
                onChangeText={(text) => setPasswordConfirmation(text) }
                secureTextEntry
                left={<TextInput.Icon tabIndex={-1} icon={'lock-outline'} rippleColor={'transparent'} />}
                onKeyPress={(e) => { if (e.nativeEvent.key === 'Enter') handleSubmit(); }}
              />
            </>
          )}
          {lastestAction === userAction && errorText && <HelperText style={styles.helperText} type="error">{errorText}</HelperText>}
          {info && <HelperText style={styles.helperText} type='info'>{info}</HelperText>}
          <Button
            style={styles.button}
            mode="contained"
            loading={loading}
            onPress={handleSubmit}
          >
            {isSignUp ? 'Sign Up' : isReset ? 'Reset password' : 'Login'}
          </Button>
        </View>
        <View style={styles.linkContainer}>
          {!isLogin && <Button onPress={() => setUserAction('login')} style={styles.toggle}>
            {'Already have an account? Log in'}
          </Button>}
          {!isSignUp && <Button onPress={() => setUserAction('signup')} style={styles.toggle}>
            {'Don\'t have an account? Sign Up'}
          </Button>}
          {!isReset && <Button onPress={() => setUserAction('reset')} style={styles.toggle}>
            {'Having trouble? Reset password'}
          </Button>}
        </View>
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
    backgroundColor: theme.colors.primary,
  },
  logoContainer: {
    position: 'absolute',
    top: '25%',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoTitle: {
    color: theme.colors.onSecondary,
  },
  content: {
    position: 'absolute',
    top: '50%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
    height: '50%',

    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,

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
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 40,
    flexGrow: 1,
    flexShrink: 0,
  },
  input: {
    marginVertical: 8,
  },
  helperText: {
    marginTop: 0,
    fontSize: 14,
  },
  button: {
    marginTop: 12,
  },
  toggle: {
    marginTop: 8,
  },
  linkContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 40,
  }
})

export default withAuth(LoginScreen, false);