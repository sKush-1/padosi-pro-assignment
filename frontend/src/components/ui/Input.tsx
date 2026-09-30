import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, isPassword, containerStyle, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, !!error && styles.inputError]}>
        <TextInput
          style={styles.input}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eye}>
            <Text style={styles.eyeText}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
  },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, height: 52, fontSize: 15, color: '#111827' },
  eye: { padding: 8 },
  eyeText: { fontSize: 16 },
  errorText: { marginTop: 4, fontSize: 12, color: '#EF4444' },
});
