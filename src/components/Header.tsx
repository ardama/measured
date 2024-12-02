import React, { useState } from 'react';
import { Appbar, Drawer as PaperDrawer, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton, type DrawerNavigationProp } from '@react-navigation/drawer';
import { router, useNavigation } from 'expo-router';
import { CommonActions, DrawerActions, type ParamListBase } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { getFontFamily } from '@u/styles';
import { Icons } from '@u/constants/Icons';

type HeaderProps = {
  title: string | JSX.Element,
  subtitle?: string | JSX.Element,
  showBackButton?: boolean,
  showMenuButton?: boolean,
  actionContent?: JSX.Element | null,
  bordered?: boolean,
}
export default function Header({
  title,
  subtitle,
  showBackButton,
  showMenuButton,
  actionContent: actionButton,
  bordered,
}: HeaderProps) {
  const theme = useTheme();

  const styles = createStyles(theme);
  const navigation = useNavigation();

  const titleContent = (
    <View style={styles.content}>
      {typeof(title) === 'string' ? <Text style={styles.title} variant='titleLarge'>{title}</Text> : title}
      {typeof(subtitle) === 'string' ? <Text style={styles.subtitle} variant='titleLarge'>{subtitle}</Text> : subtitle || null}
    </View>
  )
  return (
    <Appbar.Header
      style={[
        styles.container,
        bordered ? styles.containerBordered : {},
      ]}
    >
      {showMenuButton ? <Appbar.Action icon={'menu'} onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} /> : null}
      {showBackButton ? <Appbar.Action icon={Icons.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /> : null}
      <Appbar.Content
        style={{ paddingLeft: 4 }}
        title={titleContent}
      />
      <View style={styles.actionContent}>
        {actionButton || null}
      </View>
    </Appbar.Header>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    height: 56,
  },
  containerBordered: {
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    // textTransform: 'uppercase',
    fontFamily: getFontFamily(400),
    fontSize: 18,
  },
  subtitle: {
    // textTransform: 'uppercase',
    fontFamily: getFontFamily(300),
    fontSize: 18,
  }
});