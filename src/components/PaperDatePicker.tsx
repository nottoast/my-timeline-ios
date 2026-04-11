import React from 'react';
import { DatePickerInput } from 'react-native-paper-dates';
import { StyleSheet, Platform } from 'react-native';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  min?: Date;
}

export default function PaperDatePicker({ value, onChange, min }: Props) {
  return (
    <DatePickerInput
      locale="en-GB"
      value={value}
      onChange={(date) => {
        if (date) {
          onChange(date);
        }
      }}
      inputMode="start"
      mode="outlined"
      withDateFormatInLabel={false}
      style={styles.input}
      outlineStyle={styles.outline}
      contentStyle={styles.content}
      theme={{
        colors: {
          background: '#2a2a2a',
          onSurface: '#ffffff',
          onSurfaceVariant: '#999',
          primary: '#007AFF',
          primaryContainer: '#007AFF',
          onPrimary: '#ffffff',
          onPrimaryContainer: '#ffffff',
          outline: '#3a3a3a',
          surface: '#2a2a2a',
          surfaceVariant: '#2a2a2a',
          elevation: {
            level3: '#2a2a2a',
          },
        },
        roundness: 12,
      }}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#2a2a2a',
    width: Platform.OS === 'web' ? '50%' : '100%',
  },
  outline: {
    borderColor: '#3a3a3a',
    borderRadius: 12,
  },
  content: {
    color: '#ffffff',
  },
});
