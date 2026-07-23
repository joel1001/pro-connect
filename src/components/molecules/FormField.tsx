import { Input, InputProps } from '@/components/atoms/Input';

/** Convenience wrapper so screens use a single import for labelled fields. */
export function FormField(props: InputProps) {
  return <Input {...props} />;
}
