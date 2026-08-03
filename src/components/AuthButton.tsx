import React, { type ButtonHTMLAttributes } from 'react';

export interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: string;
  iconClass?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  loading = false,
  loadingText,
  icon,
  iconClass = 'material-symbols-outlined',
  className = '',
  ...props
}) => {
  return (
    <button className={className} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <>
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        <>
          {children}
          {icon && <span className={iconClass}>{icon}</span>}
        </>
      )}
    </button>
  );
};
