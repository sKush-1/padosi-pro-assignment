import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '@/services/api';

const CATEGORY_COLORS: Record<string, string> = {
  'Home Cleaning': '#3B82F6',
  'Plumbing': '#10B981',
  'Electrical': '#F59E0B',
  'Carpentry & Furniture': '#8B5CF6',
  'Appliance Services': '#EF4444',
};

interface Props {
  task: Task;
  selected?: boolean;
  onToggle?: (task: Task) => void;
}

export function TaskCard({ task, selected = false, onToggle }: Props) {
  const color = CATEGORY_COLORS[task.category] ?? '#6B7280';

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onToggle?.(task)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>{task.category}</Text>
        </View>
        {onToggle && (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
      </View>
      <Text style={styles.name}>{task.name}</Text>
      <Text style={styles.desc}>{task.short_description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
});
