import { Redirect, Slot, Tabs, router } from 'expo-router';
import React, { useState, type ReactNode } from 'react';

import { TabBarIcon } from '@c/navigation/TabBarIcon';
import { Colors } from '@u/constants/Colors';
import { useColorScheme } from '@u/hooks/useColorScheme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [routes] = useState([
    { key: 'measurements', title: 'Measurements', focusedIcon: 'pencil-ruler', unfocusedIcon: 'pencil-ruler-outline'},
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline'},
    { key: 'history', title: 'History', focusedIcon: 'chart-box-multiple', unfocusedIcon: 'chart-box-multiple-outline'},
  ]);

  // const renderScene = BottomNavigation.SceneMap({
  //   measurements: () => <Redirect href='explore' />,
  //   home: () => <Slot initialRouteName='home' />,
  //   history: () => <Slot initialRouteName='/',
  // })

  const renderTabBar = ({ navigation, state, descriptors, insets}: BottomTabBarProps): ReactNode => {

    return (
      <BottomNavigation.Bar
        navigationState={state}
        safeAreaInsets={insets}
        labeled={false}
        compact
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
        activeIndicatorStyle={{ height: 48, width: 88 }}
      />
    )
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen
        name="configuration"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'timer-cog' : 'timer-cog-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'format-list-checks' : 'format-list-checks'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'chart-box' : 'chart-box-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
