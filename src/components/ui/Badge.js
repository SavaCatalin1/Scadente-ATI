import React from 'react';
import clsx from 'clsx';

export function Badge({ variant='neutral', className, children, ...rest }) {
  const variantClass = {
    neutral: 'badge',
    accent: 'badge badge-accent',
    success: 'badge badge-success',
    danger: 'badge badge-danger'
  }[variant] || 'badge';
  return <span className={clsx(variantClass, className)} {...rest}>{children}</span>;
}

export default Badge;
