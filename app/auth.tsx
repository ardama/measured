import { guestSignInRequest, resetRequest, signInRequest, signUpRequest, type AuthAction } from '@s/authReducer';
import { useAuthAction, useAuthState } from '@s/selectors';
import { Error, NoError } from '@u/constants/Errors';
import { withUser } from '@u/hocs/withUser';
import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Logo from '@a/images/m_logo_2.svg';
import { createFontStyle } from '@u/styles';
import { type Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { setAuthAction } from '@s/appReducer';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [submitAttempted, setSubmitAttempted] = useState<AuthAction | null>(null);
  
  const dispatch = useDispatch();
  const userAction = useAuthAction();
  const isLogin = userAction === 'login';
  const isSignUp = userAction === 'signup';
  const isReset = userAction === 'reset'; 

  const { loading, error, info, action } = useAuthState();
  const lastestAction = submitAttempted || action;

  useEffect(() => {
    if (info) dispatch(setAuthAction('login'));
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

  const handleGuest = () => {
    dispatch(guestSignInRequest())
  }

  const errorText = getErrors().hasError ? getErrors().msg : error && `Error: ${error}`;

  const theme = useTheme();
  const { getPalette } = usePalettes();
  const palette = getPalette('yellow');
  const basePalette = getPalette();
  const styles = createStyles(theme, palette, basePalette);

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' />
      <View style={styles.logoContainer}>
        {/* <Background
          style={styles.logoBackground}
          // width={'100%'}
          height={360}
        /> */}
        <ImageBackground
          source={require('@a/images/background_1.png')}
          resizeMode="repeat"
          style={styles.logoBackground}
          tintColor={theme.colors.elevation.level5}
          imageStyle={styles.logoBackgroundImage}
        />
        <Logo 
          style={styles.logo}
          height={120}
          color={palette.primary}
        />
        <Text variant='headlineSmall' style={styles.logoTitle}>measured</Text>
      </View>
      <View style={styles.formContainer}>
        <ScrollView style={styles.formWrapper} contentContainerStyle={{ alignItems: 'center' }} automaticallyAdjustKeyboardInsets>
          <View style={styles.form}>
            <Text style={styles.title} variant='titleLarge'>
              {isSignUp ? 'Create an account' : isLogin ? 'Log in to your account' : 'Reset password'}
            </Text>
            <Text style={styles.subtitle} variant='bodyLarge'>
              {isSignUp ? 'Start measuring your life.' : isLogin ? 'Continue measuring your life.' : 'Enter your email to receive a password reset link.'}
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
              activeOutlineColor={palette.primary}
              autoComplete='email'
              inputMode='email'
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
              activeOutlineColor={palette.primary}
              autoComplete={isSignUp ? 'new-password' : 'password'}
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
                  activeOutlineColor={palette.primary}
                  autoComplete='new-password'
                />
              </>
            )}
            {lastestAction === userAction && errorText && <HelperText style={styles.helperText} type="error">{errorText}</HelperText>}
            {info && <HelperText style={styles.helperText} type='info'>{info}</HelperText>}
          </View>
          <View style={styles.controlContainer}>
            <Button
              style={styles.button}
              contentStyle={styles.buttonContent}
              mode="contained"
              loading={loading}
              onPress={handleSubmit}
              buttonColor={palette.primary}
              uppercase
            >
              {isSignUp ? 'Sign Up' : isReset ? 'Reset password' : 'Login'}
            </Button>
            <Button
              style={styles.button}
              contentStyle={styles.buttonContent}
              mode="text"
              loading={loading}
              onPress={handleGuest}
              uppercase
              textColor={palette.primary}
              
            >
              Continue as guest
            </Button>
          </View>
          <View style={{ flexGrow: 1 }} />
          <View style={styles.linkContainer}>
            {!isLogin && <Button onPress={() => dispatch(setAuthAction('login'))} style={styles.toggle} textColor={theme.colors.onSurfaceVariant}>
              {'Already have an account? Log in'}
            </Button>}
            {!isSignUp && <Button onPress={() => dispatch(setAuthAction('signup'))} style={styles.toggle} textColor={theme.colors.onSurfaceVariant}>
              {'Don\'t have an account? Sign Up'}
            </Button>}
            {!isReset && <Button onPress={() => dispatch(setAuthAction('reset'))} style={styles.toggle} textColor={theme.colors.onSurfaceVariant}>
              {'Having trouble? Reset password'}
            </Button>}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const createStyles = (theme: MD3Theme, palette: Palette, basePalette: Palette) => StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    width: '100%',
    overflow: 'visible',
    alignItems: 'center',
    backgroundColor: theme.colors.elevation.level2,
  },
  logoContainer: {
    justifyContent: 'flex-start',
    position: 'relative',
    // top: '10%',
    paddingTop: 100,
    flexGrow: 1,
    // borderRadius: 80,
    alignItems: 'center',
    overflow: 'hidden',
    // backgroundColor: palette.backdrop,
    alignSelf: 'stretch'
  },
  logo: {
  },
  logoBackground: {
    position: 'absolute',
    top: 0,
    zIndex: -1,
    height: '100%',
    width: '100%',
    opacity: 0.2,
  },
  logoBackgroundImage: {

  },
  logoTitle: {
    color: theme.colors.onSurface,
    marginTop: 16,
    fontSize: 32,
    opacity: 0.8,
    ...createFontStyle(500, false, 'fira'),
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'column',
    minHeight: '50%',
    maxHeight: '100%',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 40,
    
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    
    shadowRadius: 16,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 24,
    gap: 12,
  },
  formWrapper: {
    width: '100%',
    paddingBottom: 40,
  },
  title: {
    color: palette.primary,
  },
  subtitle: {
    color: theme.colors.onSurface,
    marginTop: 2,
    marginBottom: 12,
  },
  form: {
    width: '100%',
    paddingHorizontal: 40,
    flexShrink: 0,
  },
  input: {
    marginVertical: 12,
  },
  helperText: {
    marginTop: 0,
    fontSize: 14,
  },
  controlContainer: {
    width: '100%',
    paddingHorizontal: 40,
    flexShrink: 0,
  },
  button: {
    marginVertical: 8,
    borderRadius: 4,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  toggle: {
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 40,
  }
})

export default withUser(LoginScreen, false);