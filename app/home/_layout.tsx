import React from 'react';

import { withAuth } from '@u/hocs/withAuth';
import Header from '@c/Header';
import { Drawer } from 'expo-router/drawer';

const DrawerLayout = () => {
  return (
    <>
      <Drawer
        screenOptions={{
          header: ({ options}) => {
            const { title } = options;
            return (
              <Header title={title || ''} showMenuButton />
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
        {/* <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            header: ({ options}) => {
              const { title } = options;
              return (
                <Header title={title || ''} showBackButton />
              )
            },
          }}
        /> */}
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