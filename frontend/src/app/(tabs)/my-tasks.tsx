import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { tasksApi, Task } from '@/services/api';
import { TaskCard } from '@/components/ui/TaskCard';
import { Button } from '@/components/ui/Button';

export default function MyTasksScreen() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyTasks = useCallback(async () => {
    try {
      const res = await tasksApi.myTasks();
      setMyTasks(res.data.tasks);
    } catch {
      setMyTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyTasks();
    }, [fetchMyTasks]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTasks();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Selected Tasks</Text>
          <Text style={styles.sub}>
            Tasks and services you have selected for your profile.
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : myTasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No tasks selected yet</Text>
            <Text style={styles.emptyDesc}>
              Browse our task catalogue and pick the services you provide.
            </Text>
            <Button
              title="Browse Tasks Catalogue"
              onPress={() => router.push('/(tabs)/tasks')}
              style={styles.browseBtn}
            />
          </View>
        ) : (
          <FlatList
            data={myTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskCard task={item} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseBtn: { minWidth: 200 },
});
