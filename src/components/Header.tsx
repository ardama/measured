import React, { useState } from 'react';
import { toggleDarkMode } from '@s/appReducer';
import { useDarkMode } from '@s/selectors';
import { Appbar, Drawer as PaperDrawer } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton } from '@react-navigation/drawer';

export default function Header({ title }: { title: string }) {
  const dispatch = useDispatch();

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  return (
    <Appbar.Header elevated>

      {/* <Appbar.Action icon="menu" onPress={() => { setIsDrawerVisible(true); }} /> */}
      <DrawerToggleButton />
      <Appbar.Content title={title} />
      <Appbar.Action icon="theme-light-dark" onPress={() => { dispatch(toggleDarkMode())}} />
      {/* <Appbar.Action icon="dots-vertical" onPress={() => {}} /> */}
      {/* <Drawer

      >

      </Drawer> */}
    </Appbar.Header>
  );
}