import type { InputHTMLAttributes } from 'react';
import styles from './ui.module.css';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'style' | 'size' | 'aria-describedby' | 'aria-invalid'
>;

export interface FieldProps extends NativeInputProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
}

export function Field({
  id,
  label,
  description,
  error,
  type = 'text',
  ...inputProps
}: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {description ? (
        <p className={styles.description} id={descriptionId}>{description}</p>
      ) : null}
      <input
        {...inputProps}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={styles.input}
        id={id}
        type={type}
      />
      {error ? (
        <p className={styles.error} id={errorId}>{error}</p>
      ) : null}
    </div>
  );
}
