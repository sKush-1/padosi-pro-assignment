import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProfileScreen() {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [businessName, setBusinessName] = useState(user?.business_name ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setAddress(user.address ?? '');
      setBusinessName(user.business_name ?? '');
    }
  }, [user]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    if (!phone.trim()) {
      errs.phone = 'Mobile number is required.';
    } else {
      // Must be Indian format: +91 followed by 10 digits starting with 6-9
      const normalizedPhone = phone.trim().startsWith('+91')
        ? phone.trim()
        : `+91${phone.trim()}`;

      if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
        errs.phone =
          'Enter a valid 10-digit Indian mobile number (e.g. +919876543210).';
      }
    }

    if (!address.trim()) {
      errs.address = 'Address is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

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
      setPhone(res.data.phone ?? normalizedPhone);
      Alert.alert('Success', 'Your profile details have been saved.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message ?? 'Failed to update profile.');
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
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.sub}>
              Update your contact and service provider information.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardSection}>Account Email</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>

          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rahul Sharma"
            error={errors.name}
          />

          <Input
            label="Mobile Number (Indian +91) *"
            value={phone}
            onChangeText={setPhone}
            placeholder="+919876543210 or 10 digits"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Address *"
            value={address}
            onChangeText={setAddress}
            placeholder="Complete street address, city, pin code"
            multiline
            numberOfLines={3}
            error={errors.address}
            containerStyle={styles.multilineWrap}
          />

          <Input
            label="Business Name (Optional)"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Sharma Electrical Works"
            error={errors.businessName}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Why is Business Name optional?</Text>
            <Text style={styles.infoText}>
              Many skilled professionals and independent neighborhood service
              providers work individually without a registered business entity.
            </Text>
          </View>

          <Button
            title="Save Profile"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cardSection: { fontSize: 11, fontWeight: '700', color: '#4338CA', textTransform: 'uppercase' },
  emailText: { fontSize: 14, fontWeight: '600', color: '#1E1B4B', marginTop: 4 },
  multilineWrap: { marginBottom: 16 },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  infoText: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  saveBtn: { marginTop: 4 },
});
