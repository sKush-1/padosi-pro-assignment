import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      const { access_token, refresh_token, user } = res.data;
      await setAuth({ access_token, refresh_token }, user);
      if (!user.name || !user.phone || !user.address) {
        router.replace('/(auth)/setup-profile');
      } else {
        router.replace('/(tabs)/');
      }
    } catch (err: any) {
      if (err.message?.includes('not verified')) {
        Alert.alert(
          'Email not verified',
          'Please verify your email first.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Verify now',
              onPress: () =>
                router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim().toLowerCase() } }),
            },
          ],
        );
      } else {
        Alert.alert('Login failed', err.message ?? 'Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🏠 Padosi Pro</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to your account to continue.</Text>
        </View>

        <Input
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          isPassword
          error={errors.password}
          autoComplete="current-password"
        />

        <Button title="Log in" onPress={handleLogin} loading={loading} style={styles.btn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 36 },
  logo: { fontSize: 28, fontWeight: '800', color: '#2563EB', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280' },
  btn: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  link: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
});
