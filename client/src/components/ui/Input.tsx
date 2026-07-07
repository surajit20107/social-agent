import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full h-10 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground/50 px-3 text-sm transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 ${icon ? 'pl-10' : ''} ${error ? 'border-danger' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;