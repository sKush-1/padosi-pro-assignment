import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);

  // Inline validation calculations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const getEmailError = () => {
    if (!email.trim()) return 'Email address is required.';
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
    return undefined;
  };

  const getPasswordError = () => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    return undefined;
  };

  const getConfirmPasswordError = () => {
    if (!confirmPassword) return 'Please confirm your password.';
    if (confirmPassword !== password) return 'Passwords do not match.';
    return undefined;
  };

  const emailError = touched.email ? getEmailError() : undefined;
  const passwordError = touched.password ? getPasswordError() : undefined;
  const confirmPasswordError = touched.confirmPassword
    ? getConfirmPasswordError()
    : undefined;

  const isFormValid =
    !getEmailError() && !getPasswordError() && !getConfirmPasswordError();

  const handleRegister = async () => {
    setTouched({ email: true, password: true, confirmPassword: true });

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    try {
      await authApi.register(email.trim().toLowerCase(), password);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🏠 Padosi Pro</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Register with your email and password to connect with verified home
            service professionals.
          </Text>
        </View>

        <Input
          label="Email Address *"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (!touched.email) setTouched((t) => ({ ...t, email: true }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="you@example.com"
          keyboardType="email-address"
          error={emailError}
          autoComplete="email"
        />

        <Input
          label="Password *"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (!touched.password) setTouched((t) => ({ ...t, password: true }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder="Minimum 8 characters"
          isPassword
          error={passwordError}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password *"
          value={confirmPassword}
          onChangeText={(val) => {
            setConfirmPassword(val);
            if (!touched.confirmPassword)
              setTouched((t) => ({ ...t, confirmPassword: true }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          placeholder="Re-enter your password"
          isPassword
          error={confirmPasswordError}
          autoComplete="new-password"
        />

        <Button
          title="Register & Get Verification Code"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.btn}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 28 },
  logo: { fontSize: 28, fontWeight: '800', color: '#2563EB', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 21 },
  btn: { marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  link: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
});
