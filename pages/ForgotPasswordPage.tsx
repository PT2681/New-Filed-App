import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound, CheckCircle2, Timer, Lock } from 'lucide-react';
import { Button, Input } from '../components/FormElements';
import { RoutePath } from '../types';

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  // Timer logic for OTP step
  useEffect(() => {
    let interval: any;
    if (step === 'OTP') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email or phone number');
      return;
    }
    
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
      setTimer(300); // Reset timer
      setOtp(''); // Clear previous OTP attempts
    }, 1500);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simulate validation
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    // Simulate Verification
    setTimeout(() => {
      setIsLoading(false);
      setStep('PASSWORD');
    }, 1500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    // Simulate Password Update
    setTimeout(() => {
      setIsLoading(false);
      setStep('SUCCESS');
    }, 1500);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'EMAIL':
        return (
          <form onSubmit={handleSendOTP} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="bg-indigo-50 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
                <KeyRound className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-slate-500 mt-2 text-sm px-6">
                Enter your registered email or phone number to receive an OTP.
              </p>
            </div>
            <Input 
              label="Email or Mobile Number"
              placeholder="user@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" isLoading={isLoading}>Send OTP</Button>
          </form>
        );

      case 'OTP':
        return (
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
              <p className="text-slate-500 mt-2 text-sm px-6">
                We sent a code to <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>
            <div className="space-y-4">
              <Input 
                label="Enter OTP"
                placeholder="123456"
                className="text-center tracking-[0.5em] text-lg font-mono"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  // Only allow numbers
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(val);
                  if (error) setError('');
                }}
                required
                autoFocus
              />
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Timer className="w-4 h-4" />
                <span>Code expires in <span className="text-primary font-medium">{formatTime(timer)}</span></span>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 text-center animate-pulse">{error}</p>}
            <Button type="submit" isLoading={isLoading} disabled={timer === 0}>
              Verify & Proceed
            </Button>
            {timer === 0 && (
              <button 
                type="button" 
                onClick={handleSendOTP}
                className="w-full text-sm text-primary font-semibold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </form>
        );

      case 'PASSWORD':
        return (
          <form onSubmit={handleUpdatePassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">New Password</h2>
              <p className="text-slate-500 mt-2 text-sm">
                Create a strong password for your account.
              </p>
            </div>
            <Input 
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input 
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : undefined}
              required
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        );

      case 'SUCCESS':
        return (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 py-8">
            <div className="bg-green-100 w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="text-green-600 w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">All Done!</h2>
              <p className="text-slate-500 mt-2 text-sm">
                Your password has been successfully reset.
              </p>
            </div>
            <Button onClick={() => navigate(RoutePath.LOGIN)}>
              Back to Login
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full flex flex-col px-6 py-8">
      {step !== 'SUCCESS' && (
        <button 
          onClick={() => {
            if (step === 'EMAIL') navigate(RoutePath.LOGIN);
            else if (step === 'OTP') setStep('EMAIL');
            else if (step === 'PASSWORD') setStep('OTP');
          }}
          className="self-start p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      <div className="flex-1 flex flex-col justify-center">
        {renderStepContent()}
      </div>
    </div>
  );
};