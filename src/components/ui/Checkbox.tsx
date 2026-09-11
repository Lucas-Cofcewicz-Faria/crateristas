import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import styles from './form-controls.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  id: string;
  label: ReactNode;
  description?: string;
};

export function Checkbox({ id, label, description, className, 'aria-describedby': describedBy, ...props }: Props) {
  const descriptionId = description ? `${id}-description` : undefined;
  return <div className={[styles.checkbox, className].filter(Boolean).join(' ')}>
    <label className={styles.checkLabel} htmlFor={id}>
      <input {...props} id={id} type="checkbox" className={styles.checkInput}
        aria-describedby={[describedBy, descriptionId].filter(Boolean).join(' ') || undefined} />
      <span className={styles.checkBox} aria-hidden="true"><Check size={16} /></span>
      <span>{label}</span>
    </label>
    {description && <p id={descriptionId} className={styles.description}>{description}</p>}
  </div>;
}
