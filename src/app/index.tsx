import { Redirect } from 'expo-router';

import { useApp } from '@/context/AppContext';

export default function Index() {
  const { state } = useApp();
  return <Redirect href={state.isAuthenticated ? '/(tabs)' : '/(auth)'} />;
}