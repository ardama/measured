import { useAuthState, useIsAuthenticated } from '@s/selectors';
import { getCurrentUser } from '@/firebase';

export const useAuth = () => {
  const authState = useAuthState();
  const isAuthenticated = useIsAuthenticated();

  return {
    authUser: getCurrentUser(),
    isAuthenticated,
    ...authState,
  };
};