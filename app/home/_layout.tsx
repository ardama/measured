import { Tabs } from 'expo-router';
import React, { type ReactNode } from 'react';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation, Icon, useTheme } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import { withAuth } from '@u/hocs/withAuth';
import Header from '@c/Header';
import { Icons } from '@u/constants/Icons';
import { usePalettes } from '@u/hooks/usePalettes';

const TabLayout = () => {
  const theme = useTheme();
  const { globalPalette } = usePalettes();

  const renderTabBar = ({ navigation, state, descriptors, insets}: BottomTabBarProps): ReactNode => {
    return (
      <BottomNavigation.Bar
        navigationState={state}
        safeAreaInsets={insets}
        labeled
        activeIndicatorStyle={{ backgroundColor: globalPalette.backdrop }}
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
        renderIcon={({ route, focused }) => {
          const { options } = descriptors[route.key];
          const color = theme.colors.onSurface;
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
    <Tabs
      screenOptions={{
        header: ({ layout, options, route, navigation }) => {
          const { title } = options
          return (
            <Header showMenuButton title={title || ''} />
          )
        },
      }}
      tabBar={renderTabBar}
      initialRouteName='index'
    >
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused, size }) => 
            <Icon
              source={focused ? Icons.chartFilled : Icons.chart}
              color={color}
              size={size}
            />
          ,
        }}
        />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Measure',
          tabBarIcon: ({ color, focused, size }) => (
            <Icon
                source={focused ? Icons.recordingFilled : Icons.recording}
                color={color}
                size={size}
              />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused, size }) => 
            <Icon
              source={focused ? Icons.accountFilled : Icons.account}
              color={color}
              size={size}
            />
          ,
          headerShown: false,
        }}
        />
    </Tabs>
  );
}

export default withAuth(TabLayout);