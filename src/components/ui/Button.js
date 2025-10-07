import React from 'react';
import clsx from 'clsx';

/**
 * Button primitive
 * Props: variant (primary|danger|outline|ghost), size (sm|md|lg), fullWidth, icon (node), disabled
 */
export function Button({
  as: Comp = 'button',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  icon,
  children,
  ...rest
}) {
  const variantClass = {
    default: 'btn',
    primary: 'btn btn-primary',
    danger: 'btn btn-danger',
    outline: 'btn btn-outline',
    ghost: 'btn btn-ghost'
  }[variant] || 'btn';

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  }[size];

  return (
    <Comp
      className={clsx(variantClass, sizeClass, fullWidth && 'w-full', className)}
      {...rest}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </Comp>
  );
}

export default Button;
