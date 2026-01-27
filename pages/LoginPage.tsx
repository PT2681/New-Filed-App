import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button, Input } from '../components/FormElements';
import { RoutePath } from '../types';
import { APP_NAME } from '../constants';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.identifier || !formData.password) {
      setError('Please enter both ID and password');
      return;
    }

    setIsLoading(true);

    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      // For blueprint purposes, we accept any non-empty input
      localStorage.setItem('isAuthenticated', 'true');
      navigate(RoutePath.HOME);
    }, 1500);
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-12 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <div className="bg-gradient-to-tr from-primary to-purple-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
          <LogIn className="text-white w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
        <p className="text-slate-500 mt-2 text-sm">Sign in to continue to {APP_NAME}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <Input 
          label="Email or Mobile Number"
          placeholder="user@example.com"
          type="text"
          icon={Mail}
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
        />

        <div className="relative">
          <Input 
            label="Password"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button 
            type="button"
            onClick={() => navigate(RoutePath.FORGOT_PASSWORD)}
            className="text-sm font-medium text-primary hover:text-indigo-700"
          >
            Forgot Password?
          </button>
        </div>

        <Button type="submit" isLoading={isLoading}>
          Log In
        </Button>
      </form>
    </div>
  );
};