import { Tabs } from 'expo-router';
import { Home, Megaphone, MessageCircle, Search, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ResponsiveTabBar } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';

export default function TabsLayout() {
  const { unreadNotificationCount } = useApp();
  const { sidebarOffset, useSidebarNav } = useResponsive();

  return (
    <View style={[styles.root, { paddingLeft: sidebarOffset }]}>
      <Tabs
        tabBar={(props) => <ResponsiveTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: 'Browse',
            tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bulletin-board"
          options={{
            title: 'Bulletin',
            tabBarIcon: ({ color, size }) => <Megaphone size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
            tabBarBadge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
            // Hide from mobile bottom bar — accessible via header icon & sidebar on web
            tabBarItemStyle: useSidebarNav ? undefined : { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
