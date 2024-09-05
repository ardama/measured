import React from 'react';
import { toggleDarkMode } from '@s/appReducer';
import { useDarkMode } from '@s/selectors';
import { Appbar } from 'react-native-paper';
import { useDispatch } from 'react-redux';

export default function Header({ title }: { title: string }) {
  const dispatch = useDispatch();

  return (
    <Appbar.Header>
      <Appbar.Action icon="menu" onPress={() => {}} />
      <Appbar.Content title={title} />
      <Appbar.Action icon="theme-light-dark" onPress={() => { dispatch(toggleDarkMode())}} />
      <Appbar.Action icon="dots-vertical" onPress={() => {}} />
    </Appbar.Header>
  );
}