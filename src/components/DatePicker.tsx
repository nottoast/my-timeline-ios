import { createElement } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  min?: string;
}

export default function DatePicker({ value, onChange, min }: Props) {
  return createElement('input', {
    type: 'date',
    value: value,
    min: min,
    onInput: (e: any) => onChange(e.target.value),
    style: {
      display: 'block',
      backgroundColor: '#3a3a3a',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#ffffff',
      border: '1px solid #4a4a4a',
      width: '100%',
      boxSizing: 'border-box',
      colorScheme: 'dark',
    },
  });
}
