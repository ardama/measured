import { useAuthState } from '@s/selectors';
import { getCurrentUser } from '@/firebase';

export const useAuth = () => {
  const authState = useAuthState();
  return {
    authUser: getCurrentUser(),
    ...authState,
  };
};