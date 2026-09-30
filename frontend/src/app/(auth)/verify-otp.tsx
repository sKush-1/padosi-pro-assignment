import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

const RESEND_COOLDOWN = 30;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState('');

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, otp);
      const { access_token, refresh_token, user } = res.data;
      await setAuth({ access_token, refresh_token }, user);
      if (!user.name || !user.phone || !user.address) {
        router.replace('/(auth)/setup-profile');
      } else {
        router.replace('/(tabs)/');
      }
    } catch (err: any) {
      setError(err.message ?? 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await authApi.resendOtp(email);
      setCountdown(RESEND_COOLDOWN);
      setOtp('');
      setError('');
      Alert.alert('Sent!', 'A new code has been sent to your email.');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  }, [email]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>📩</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <Text style={styles.otpLabel}>Enter verification code</Text>
        <OtpInput value={otp} onChange={setOtp} />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length !== 6}
          style={styles.btn}
        />

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't get the code? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.link}>{resending ? 'Sending…' : 'Resend OTP'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.hint}>Code expires in 10 minutes · {5} attempts allowed</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24 },
  back: { marginTop: 12, marginBottom: 32 },
  backText: { color: '#2563EB', fontSize: 16, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 36 },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  email: { color: '#111827', fontWeight: '600' },
  otpLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 13, textAlign: 'center' },
  btn: { marginTop: 28 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  resendLabel: { color: '#6B7280', fontSize: 14 },
  countdown: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  link: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  hint: { textAlign: 'center', marginTop: 16, color: '#9CA3AF', fontSize: 12 },
});
