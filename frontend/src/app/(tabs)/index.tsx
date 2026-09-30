import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { tasksApi, Task } from '@/services/api';
import { TaskCard } from '@/components/ui/TaskCard';
import { Button } from '@/components/ui/Button';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSelectedTasks = useCallback(async () => {
    try {
      const res = await tasksApi.myTasks();
      setSelectedTasks(res.data.tasks);
    } catch {
      setSelectedTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSelectedTasks();
    }, [fetchSelectedTasks]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSelectedTasks();
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of Padosi Pro?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Partner';
  const profileComplete = !!(user?.name && user?.phone && user?.address);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>🏠 Padosi Pro</Text>
            <Text style={styles.greeting}>Welcome, {displayName}</Text>
            {user?.business_name && (
              <Text style={styles.businessBadge}>🏢 {user.business_name}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Profile incomplete warning */}
        {!profileComplete && (
          <TouchableOpacity
            style={styles.banner}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerTitle}>⚠️ Incomplete Profile</Text>
            <Text style={styles.bannerSub}>
              Tap here to add your mobile number and address so customers can reach
              you.
            </Text>
          </TouchableOpacity>
        )}

        {/* User's Selected Tasks Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Selected Services</Text>
            <Text style={styles.sectionSub}>
              {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'} configured for your profile
            </Text>
          </View>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push('/(tabs)/tasks')}
          >
            <Text style={styles.manageBtnText}>Edit Tasks ✏️</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading your tasks...</Text>
          </View>
        ) : selectedTasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks selected yet</Text>
            <Text style={styles.emptyDesc}>
              Select the neighborhood tasks you can perform so local clients can
              discover your services.
            </Text>
            <Button
              title="Browse & Select Tasks"
              onPress={() => router.push('/(tabs)/tasks')}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <View style={styles.tasksList}>
            {selectedTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </View>
        )}

        {/* Profile Details Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <Text style={styles.profileCardTitle}>Profile Overview</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.editProfileLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Email</Text>
            <Text style={styles.profileValue}>{user?.email}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Phone</Text>
            <Text style={styles.profileValue}>{user?.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Address</Text>
            <Text style={styles.profileValue}>{user?.address || 'Not provided'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerLeft: { flex: 1 },
  logo: { fontSize: 18, fontWeight: '800', color: '#2563EB', marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#111827' },
  businessBadge: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  banner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 20,
  },
  bannerTitle: { fontWeight: '700', color: '#92400E', marginBottom: 2 },
  bannerSub: { color: '#B45309', fontSize: 13, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  manageBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  centerLoading: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 13 },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptyDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyBtn: { minWidth: 200, height: 44 },
  tasksList: { marginBottom: 20 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  editProfileLink: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileLabel: { fontSize: 13, color: '#9CA3AF' },
  profileValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});
