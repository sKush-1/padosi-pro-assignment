import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

interface Props {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: Props) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const arr = value.split('').slice(0, length);
    while (arr.length < length) arr.push('');
    arr[index] = digit;
    const next = arr.join('');
    onChange(next);
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref: TextInput | null) => {
            inputs.current[i] = ref;
          }}
          style={[styles.cell, value[i] ? styles.filled : null]}
          value={value[i] ?? ''}
          onChangeText={(t: string) => handleChange(t, i)}
          onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  filled: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
});
