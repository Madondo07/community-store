import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function RootIndex() {
  const { state, initializing } = useApp();

  // Wait for the initial Supabase session check — otherwise an
  // already-signed-in user briefly flashes to the sign-in screen on
  // every reload before the restored session comes back.
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.navy} />
      </View>
    );
  }

  // If authenticated, go to tabs — except admins, who land on their
  // dashboard first (Visit Store from there gets them into the tabs).
  if (state.isAuthenticated) {
    return <Redirect href={state.user?.role === 'admin' ? '/admin-dashboard' : '/(tabs)'} />;
  }

  return <Redirect href="/(auth)" />;
}
