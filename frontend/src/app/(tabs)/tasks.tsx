import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { tasksApi, Task } from '@/services/api';
import { TaskCard } from '@/components/ui/TaskCard';
import { Button } from '@/components/ui/Button';

interface TaskSection {
  title: string;
  data: Task[];
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load all tasks and existing user selection
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catsRes, tasksRes, myTasksRes] = await Promise.all([
        tasksApi.categories(),
        tasksApi.list(),
        tasksApi.myTasks().catch(() => ({ data: { tasks: [] } })),
      ]);

      setCategories(['All', ...catsRes.data.categories]);
      setTasks(tasksRes.data.tasks);

      if (myTasksRes.data.tasks) {
        setSelectedTaskIds(myTasksRes.data.tasks.map((t) => t.id));
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message ?? 'Failed to load task catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle selection
  const toggleTask = (task: Task) => {
    setSelectedTaskIds((prev) =>
      prev.includes(task.id)
        ? prev.filter((id) => id !== task.id)
        : [...prev, task.id],
    );
  };

  // Filter tasks by category and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesCategory =
        selectedCategory === 'All' || t.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.short_description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tasks, selectedCategory, searchQuery]);

  // Group tasks by category for SectionList
  const sections: TaskSection[] = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      if (!map.has(t.category)) {
        map.set(t.category, []);
      }
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [filteredTasks]);

  // Selected task objects for the confirmation step
  const selectedTasksList = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.includes(t.id));
  }, [tasks, selectedTaskIds]);

  // Trigger confirm modal
  const handleProceedToConfirm = () => {
    if (selectedTaskIds.length === 0) {
      Alert.alert('Notice', 'Please select at least one task before continuing.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Save selection and redirect to Home screen
  const handleFinalConfirmSave = async () => {
    setSaving(true);
    try {
      await tasksApi.selectTasks(selectedTaskIds);
      setShowConfirmModal(false);
      Alert.alert(
        'Tasks Saved!',
        'Your selected tasks have been saved. Returning to Home.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/'),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err.message ?? 'Could not save your tasks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Task Selection</Text>
          <Text style={styles.sub}>
            Pick the services you provide. Grouped by category with instant search.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, services, categories..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <View style={styles.catWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {categories.map((cat) => {
              const active = cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Task List grouped by category */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading task catalogue...</Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No matching tasks</Text>
            <Text style={styles.emptyText}>
              Try searching for something else or reset your category filter.
            </Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnText}>Reset search & filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                selected={selectedTaskIds.includes(item.id)}
                onToggle={toggleTask}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Bottom Selection Bar */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerCount}>
              {selectedTaskIds.length}{' '}
              {selectedTaskIds.length === 1 ? 'task' : 'tasks'} selected
            </Text>
            <Text style={styles.footerHint}>Tap tasks to add or remove</Text>
          </View>
          <Button
            title="Review & Confirm"
            onPress={handleProceedToConfirm}
            disabled={selectedTaskIds.length === 0 || loading}
            style={styles.saveBtn}
          />
        </View>

        {/* Confirm Selection Step Modal */}
        <Modal
          visible={showConfirmModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confirm Task Selection</Text>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                You have selected {selectedTasksList.length} services for your
                profile. These will be displayed on your Home dashboard.
              </Text>

              <ScrollView style={styles.modalScroll}>
                {selectedTasksList.map((t, idx) => (
                  <View key={t.id} style={styles.modalItem}>
                    <Text style={styles.modalItemNum}>{idx + 1}.</Text>
                    <View style={styles.modalItemBody}>
                      <Text style={styles.modalItemName}>{t.name}</Text>
                      <Text style={styles.modalItemCat}>{t.category}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Modify Selection"
                  variant="outline"
                  onPress={() => setShowConfirmModal(false)}
                  style={styles.modalBtnCancel}
                />
                <Button
                  title="Confirm & Save"
                  onPress={handleFinalConfirmSave}
                  loading={saving}
                  style={styles.modalBtnConfirm}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', height: '100%' },
  clearIcon: { fontSize: 16, color: '#9CA3AF', padding: 4 },
  catWrap: { height: 44, marginBottom: 6 },
  catScroll: { paddingHorizontal: 20, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  pillActive: { backgroundColor: '#2563EB' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  pillTextActive: { color: '#FFFFFF' },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  resetBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  footerInfo: { flex: 1 },
  footerCount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  footerHint: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  saveBtn: { minWidth: 160, height: 48 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 20, color: '#9CA3AF', padding: 4 },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 16,
  },
  modalScroll: { maxHeight: 300, marginBottom: 20 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    width: 24,
  },
  modalItemBody: { flex: 1 },
  modalItemName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  modalItemCat: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: { flex: 1, height: 48 },
  modalBtnConfirm: { flex: 1.2, height: 48 },
});
