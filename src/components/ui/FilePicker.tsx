'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { ImagePlus } from 'lucide-react';
import styles from './form-controls.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { id: string; label: string };

export const FilePicker = forwardRef<HTMLInputElement, Props>(function FilePicker({ id, label, className, ...props }, ref) {
  return <label className={[styles.filePicker, className].filter(Boolean).join(' ')} htmlFor={id}>
    <input {...props} ref={ref} id={id} type="file" className={styles.fileInput} />
    <span className={styles.fileButton}><ImagePlus size={18} aria-hidden="true" />{label}</span>
  </label>;
});
