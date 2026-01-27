import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-indigo-600 shadow-md shadow-indigo-200 disabled:bg-indigo-300",
    outline: "border-2 border-slate-200 text-slate-700 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400",
    ghost: "text-primary hover:bg-indigo-50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>}
      <div className="relative">
        <input 
          className={`w-full bg-slate-50 border ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-indigo-100'} rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${Icon ? 'pl-11' : ''} ${className}`}
          {...props}
        />
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        )}
      </div>
      {error && <p className="text-xs text-red-500 ml-1 animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
};