import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SetupProfileScreen() {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [businessName, setBusinessName] = useState(user?.business_name ?? '');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Inline validators
  const getNameError = () => {
    if (!name.trim()) return 'Full name is required.';
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    return undefined;
  };

  const getPhoneError = () => {
    if (!phone.trim()) return 'Mobile number is required.';
    const normalized = phone.trim().startsWith('+91')
      ? phone.trim()
      : `+91${phone.trim()}`;
    if (!/^\+91[6-9]\d{9}$/.test(normalized)) {
      return 'Enter a valid Indian mobile number (e.g. +919876543210).';
    }
    return undefined;
  };

  const getAddressError = () => {
    if (!address.trim()) return 'Address is required.';
    return undefined;
  };

  const nameError = touched.name ? getNameError() : undefined;
  const phoneError = touched.phone ? getPhoneError() : undefined;
  const addressError = touched.address ? getAddressError() : undefined;

  const handleCompleteSetup = async () => {
    setTouched({ name: true, phone: true, address: true });

    if (getNameError() || getPhoneError() || getAddressError()) {
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = phone.trim().startsWith('+91')
        ? phone.trim()
        : `+91${phone.trim()}`;

      const res = await userApi.updateProfile({
        name: name.trim(),
        phone: normalizedPhone,
        address: address.trim(),
        business_name: businessName.trim() || undefined,
      });

      setUser(res.data);
      // Onboarded -> proceed straight to task selection
      router.replace('/(tabs)/tasks');
    } catch (err: any) {
      Alert.alert('Profile Setup Failed', err.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step 1 of 2: Profile</Text>
            </View>
            <Text style={styles.title}>Complete your profile</Text>
            <Text style={styles.sub}>
              Tell us a bit about yourself so neighbors and customers can connect
              with you.
            </Text>
          </View>

          <Input
            label="Full Name *"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (!touched.name) setTouched((t) => ({ ...t, name: true }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            placeholder="e.g. Ramesh Kumar"
            error={nameError}
          />

          <Input
            label="Mobile Number (Indian +91) *"
            value={phone}
            onChangeText={(val) => {
              setPhone(val);
              if (!touched.phone) setTouched((t) => ({ ...t, phone: true }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            placeholder="+919876543210 or 10 digits"
            keyboardType="phone-pad"
            error={phoneError}
          />

          <Input
            label="Address *"
            value={address}
            onChangeText={(val) => {
              setAddress(val);
              if (!touched.address) setTouched((t) => ({ ...t, address: true }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            placeholder="Street address, colony, city, postal code"
            multiline
            numberOfLines={3}
            error={addressError}
          />

          <Input
            label="Business Name (Optional)"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Ramesh Home Electricals"
          />

          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>💡 Why is Business Name optional?</Text>
            <Text style={styles.noteText}>
              Many home service professionals operate independently without an
              officially registered company. You can always add one later.
            </Text>
          </View>

          <Button
            title="Save & Proceed to Tasks"
            onPress={handleCompleteSetup}
            loading={loading}
            disabled={loading}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  stepBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  stepBadgeText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6B7280', lineHeight: 21 },
  noteBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noteTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  noteText: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  btn: { marginTop: 8 },
});
