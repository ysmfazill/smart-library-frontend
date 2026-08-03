import React, { type InputHTMLAttributes } from 'react';

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  labelRight?: React.ReactNode;
  icon?: string;
  labelClass?: string;
  iconClass?: string;
  wrapperClass?: string;
  rightElement?: React.ReactNode;
  containerClass?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  labelRight,
  icon,
  labelClass = '',
  iconClass = '',
  className = '',
  wrapperClass = '',
  rightElement,
  containerClass = 'space-y-2',
  ...props
}) => {
  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center">
        <label className={labelClass} htmlFor={id}>
          {label}
        </label>
        {labelRight}
      </div>
      <div className={`relative ${wrapperClass}`}>
        {icon && (
          <span className={iconClass}>
            {icon}
          </span>
        )}
        <input id={id} className={className} {...props} />
        {rightElement}
      </div>
    </div>
  );
};
