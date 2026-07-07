import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-border bg-card p-5 transition-all duration-200 ${hover ? 'hover:bg-card-hover hover:border-border/80 cursor-pointer' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;