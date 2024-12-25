import Settings from '@c/Settings';
import { withUser } from '@u/hocs/withUser';
import React from 'react';


const SettingsScreen = () => {
  return (
    <Settings />
  )
}

export default withUser(SettingsScreen);