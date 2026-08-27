import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { Poppins_700Bold, Poppins_800ExtraBold, useFonts } from "@expo-google-fonts/poppins";
import "expo-insights";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing-detail" options={{ presentation: "card" }} />
          <Stack.Screen name="new-listing" options={{ presentation: "modal" }} />
          <Stack.Screen name="cart" options={{ presentation: "card" }} />
          <Stack.Screen name="checkout" options={{ presentation: "card" }} />
          <Stack.Screen name="order-confirmed" options={{ presentation: "card" }} />
          <Stack.Screen name="rate-purchase" options={{ presentation: "modal" }} />
          <Stack.Screen name="seller-profile" options={{ presentation: "card" }} />
          <Stack.Screen name="notifications" options={{ presentation: "card" }} />
          <Stack.Screen name="admin-dashboard" options={{ presentation: "card" }} />
          <Stack.Screen name="bulletin-composer" options={{ presentation: "modal" }} />
          <Stack.Screen name="search-results" options={{ presentation: "card" }} />
          <Stack.Screen name="chat-thread" options={{ presentation: "card" }} />
          <Stack.Screen name="settings" options={{ presentation: "card" }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}