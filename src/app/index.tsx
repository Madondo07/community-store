import { Redirect } from 'expo-router';

import { useApp } from '@/context/AppContext';

export default function RootIndex() {
  const { state } = useApp();

  // If authenticated, go to tabs. Otherwise, go to auth.
  if (state.isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
