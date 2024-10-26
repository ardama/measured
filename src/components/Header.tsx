import React, { useState } from 'react';
import { toggleDarkMode } from '@s/appReducer';
import { useDarkMode } from '@s/selectors';
import { Appbar, Drawer as PaperDrawer, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton, type DrawerNavigationProp } from '@react-navigation/drawer';
import { router, useNavigation } from 'expo-router';
import { CommonActions, DrawerActions, type ParamListBase } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { getFontFamily } from '@u/styles';

type HeaderProps = {
  title?: string,
  showBackButton?: boolean,
  showMenuButton?: boolean,
  actionButton?: JSX.Element | null,
}
export default function Header({ title, showBackButton, showMenuButton, actionButton }: HeaderProps) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();

  const styles = createStyles(theme);

  return (
    <Appbar.Header style={{ backgroundColor: theme.colors.elevation.level3 }}>
      {/* {showMenuButton ? <Appbar.Action icon={'menu'} onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} /> : null} */}
      {showBackButton ? <Appbar.Action icon={'chevron-left'} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /> : null}
      <Appbar.Content title={title} />
      {actionButton || null}
      <Appbar.Action icon="theme-light-dark" onPress={() => { dispatch(toggleDarkMode())}} />
    </Appbar.Header>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  title: {
    textTransform: 'uppercase',
    fontFamily: getFontFamily(400),
    fontSize: 18,
  }
});