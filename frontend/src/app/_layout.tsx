import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { hydrate, isHydrated, user } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    SplashScreen.hideAsync();
    if (user) {
      if (!user.name || !user.phone || !user.address) {
        router.replace('/(auth)/setup-profile');
      } else {
        router.replace('/(tabs)/');
      }
    } else {
      router.replace('/(auth)/login');
    }
  }, [isHydrated, user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
