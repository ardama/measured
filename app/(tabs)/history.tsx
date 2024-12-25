import History from '@c/History';
import { withUser } from '@u/hocs/withUser';
import React from 'react';


const HistoryScreen = () => {
  return (
    <History />
  )
}

export default withUser(HistoryScreen);