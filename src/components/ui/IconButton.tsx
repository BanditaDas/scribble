import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon: React.ReactNode;
  label?: string;
}

export const IconButton = ({ active, icon, label, className = '', ...props }: IconButtonProps) => {
  return (
    <button
      className={`p-2 rounded-md transition-colors flex items-center justify-center ${
        active
          ? 'bg-[#FF5A36]/10 text-[#FF5A36]'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-gray-100'
      } ${className}`}
      title={label}
      {...props}
    >
      {icon}
    </button>
  );
};
