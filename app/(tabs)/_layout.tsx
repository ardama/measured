import { Tabs } from 'expo-router';
import React, { type ReactNode } from 'react';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation, Icon, TouchableRipple, useTheme } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import { withUser } from '@u/hocs/withUser';
import Header from '@c/Header';
import { Icons } from '@u/constants/Icons';
import { usePalettes } from '@u/hooks/usePalettes';
import { StatusBar } from 'react-native';

const TabLayout = () => {
  const theme = useTheme();
  const { globalPalette } = usePalettes();

  const renderTabBar = ({ navigation, state, descriptors, insets}: BottomTabBarProps): ReactNode => {
    return (
      <BottomNavigation.Bar
        navigationState={state}
        safeAreaInsets={insets}
        labeled={false}
        style={{ backgroundColor: theme.colors.surface }}
        activeIndicatorStyle={{ backgroundColor: globalPalette.backdrop, borderRadius: 4, height: 40 }}
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
        renderTouchable={({ key, ...props }) => <TouchableRipple key={key} {...props} />}
      />
    )
  }

  return (
    <Tabs
      screenOptions={{
        header: ({ layout, options, route, navigation }) => {
          const { title } = options
          return (
            <>
              <StatusBar
                backgroundColor={theme.colors.surface}
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
              />
              {/* <Header showMenuButton title={title || ''} /> */}
            </>
          )
        },
      }}
      tabBar={renderTabBar}
      initialRouteName='home'
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
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
        name="history"
        options={{
          title: 'Data',
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

export default withUser(TabLayout);