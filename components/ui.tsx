
import React from 'react';
import type { User } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, className = '', ...props }) => {
  const baseClasses = 'w-full text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
  const variantClasses = {
    primary: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
    secondary: 'bg-orange-400 hover:bg-orange-500 focus:ring-orange-400',
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={id}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
      {...props}
    />
  </div>
);

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-teal-400 shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Keep Notes</h1>
          <p className="text-sm text-white opacity-90">Homepage / Your Notes</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white hidden sm:block">About</span>
          <span className="text-white hidden sm:block">Notes</span>
          <span className="text-white font-semibold">{user?.username}</span>
          <button
            onClick={onLogout}
            className="bg-white text-teal-500 font-semibold px-4 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
};

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-16 h-16 border-4',
  };
  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent border-white`}></div>
  );
};

interface FloatingActionButtonProps {
    onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-8 right-8 bg-orange-400 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-transform duration-200 ease-in-out hover:scale-110"
            aria-label="Add new note"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
    );
};
