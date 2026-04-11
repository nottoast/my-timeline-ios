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
        backgroundColor: 'rgba(42,42,42,1.00)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
        border: '1px solid rgba(58,58,58,1.00)',
        width: '50%',
        boxSizing: 'border-box',
        colorScheme: 'dark',
      },
    })
}
