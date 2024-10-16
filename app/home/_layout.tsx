import { Redirect, Slot, Tabs, router } from 'expo-router';
import React, { useState, type ReactNode } from 'react';

import { TabBarIcon } from '@c/navigation/TabBarIcon';
import { Colors } from '@u/constants/Colors';
import { useColorScheme } from '@u/hooks/useColorScheme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation, Icon, Portal, Text } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import { withAuth } from '@u/hocs/withAuth';
import { TabScreen } from 'react-native-paper-tabs';
import Header from '@c/Header';
import { Icons } from '@u/constants/Icons';
import { Drawer } from 'expo-router/drawer';
import { DrawerToggleButton } from '@react-navigation/drawer';

const DrawerLayout = () => {
  const colorScheme = useColorScheme();

  const renderTabBar = ({ navigation, state, descriptors, insets}: BottomTabBarProps): ReactNode => {

    return (
      <BottomNavigation.Bar
        navigationState={state}
        safeAreaInsets={insets}
        onTabPress={({ route, preventDefault }) => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (event.defaultPrevented) preventDefault();
          else {
            navigation.dispatch({
              ...CommonActions.navigate(route.name, route.params),
              target: state.key,
            })
          }
        }}
        renderIcon={({ route, focused, color }) => {
          const { options } = descriptors[route.key];
          if (options.tabBarIcon) {
            return options.tabBarIcon({ focused, color, size: 24 });
          }
        }}
        getLabelText={({ route }) => {
          const { options } = descriptors[route.key];
          return options?.title || '';
        }}
      />
    )
  }

  return (
    <>
      <Drawer
        screenOptions={{
          header: ({ layout, options, route, navigation }) => {
            const { title } = options;
            return (
              <Header title={title || ''} />
            )
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
        <Drawer.Screen
          name="signout"
          options={{
            title: 'Sign out',
          }}
        />
      </Drawer>
    </>
  );
}

export default withAuth(DrawerLayout);