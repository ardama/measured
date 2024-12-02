import History from '@c/History';
import { withAuth } from '@u/hocs/withAuth';
import React from 'react';


const HistoryScreen = () => {
  return (
    <History />
  )
}

export default withAuth(HistoryScreen);