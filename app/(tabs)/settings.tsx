import Settings from '@c/Settings';
import { withAuth } from '@u/hocs/withAuth';
import React from 'react';


const SettingsScreen = () => {
  return (
    <Settings />
  )
}

export default withAuth(SettingsScreen);