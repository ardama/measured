import { withUser } from '@u/hocs/withUser';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

const RootRedirect = () => {
  return <Redirect href={'/(tabs)/home'} />;
}

export default withUser(RootRedirect);