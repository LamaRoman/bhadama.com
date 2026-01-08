"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailVerificationModal({ isOpen, onClose, userEmail }) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const { updateUser } = useAuth(); // ✅ Get updateUser function

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      await api('/api/verification/email/verify', {
        method: 'POST',
        body: { otp: code },
      });

      // ✅ Update user state instead of reloading
      updateUser({ emailVerified: true });
      
      alert('Email verified successfully! ✅');
      onClose();
    } catch (error) {
      setError(error.message || 'Invalid or expired code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Verify Your Email</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          We've sent a verification code to <strong>{userEmail}</strong>
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-2 border rounded-md mb-4"
            required
          />

          {error && (
            <div className="text-red-600 text-sm mb-4">{error}</div>
          )}

          <button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  );
}