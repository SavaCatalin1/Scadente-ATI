import React from 'react';
import clsx from 'clsx';

export function Card({ as:Comp='div', className, children, padded=true, interactive=false, ...rest }) {
  return (
    <Comp
      className={clsx('card', interactive && 'card-interactive', padded && 'card-padded', className)}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ className, ...rest }) {
  return <div className={clsx('card-header', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }) {
  return <div className={clsx('card-footer', className)} {...rest} />;
}

export default Card;
