import { Redirect } from 'expo-router';

import { Spinner } from '@/components/atoms';
import { roleHome } from '@/config/roles';
import { useAuthStore } from '@/store/authStore';

/** Entry point: route to the active role's home, or to onboarding. */
export default function Index() {
  const { status, activeRole } = useAuthStore();

  if (status === 'loading') return <Spinner fullscreen />;
  if (status === 'unauthenticated' || !activeRole) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  return <Redirect href={roleHome(activeRole) as never} />;
}
