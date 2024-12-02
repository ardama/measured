import { withAuth } from '@u/hocs/withAuth';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

const RootRedirect = () => {
  return <Redirect href={'/(tabs)/home'} />;
}

export default withAuth(RootRedirect);