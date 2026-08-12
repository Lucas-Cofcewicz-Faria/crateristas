import type { ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'style' | 'color'
>;

export interface ButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'regular';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'regular',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ');

  return <button {...props} className={className} type={type} />;
}
