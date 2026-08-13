import "expo-insights";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider } from "@/context/AppContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="listing-detail"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="new-listing"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="cart" options={{ presentation: "card" }} />
          <Stack.Screen name="checkout" options={{ presentation: "card" }} />
          <Stack.Screen
            name="order-confirmed"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="rate-purchase"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="seller-profile"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="notifications"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="admin-dashboard"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="search-results"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="chat-thread"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="settings"
            options={{ presentation: "card" }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
