import { forwardRef, type ButtonHTMLAttributes } from 'react';
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'regular',
  fullWidth = false,
  type = 'button',
  ...props
}, ref) {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ');

  return <button {...props} className={className} ref={ref} type={type} />;
});
