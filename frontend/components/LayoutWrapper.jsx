'use client';
import { useAuth } from '@/contexts/AuthContext';
import VerificationBanner from '@/components/verification/VerificationBanner';
import PhoneVerificationBanner from '@/components/verification/PhoneVerificationBanner';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }) {
  const { user, refreshUser } = useAuth();
  const pathname = usePathname();

  const excludedPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  const isExcludedPath = excludedPaths.includes(pathname);

  // Email verification banner - show if user exists and email not verified
  const shouldShowEmailBanner = user && 
                                !user.emailVerified && 
                                !user.email_verified &&
                                !isExcludedPath;

  // Phone verification banner - show if:
  // - User exists
  // - Phone not verified
  // - Not on excluded pages
  // - For HOST: always show (required)
  // - For USER: only show if they have a phone number (optional)
  const shouldShowPhoneBanner = user && 
                                !user.phoneVerified &&
                                !isExcludedPath &&
                                (user.role === 'HOST' || user.phone);

  const handleEmailVerified = async () => {
    try {
      await refreshUser();
      console.log('✅ User data refreshed after email verification');
    } catch (error) {
      if (!error.message?.includes('already verified')) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const handlePhoneVerified = async () => {
    try {
      await refreshUser();
      console.log('✅ User data refreshed after phone verification');
    } catch (error) {
      if (!error.message?.includes('already verified')) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  return (
    <main className="min-h-screen">
      {(shouldShowEmailBanner || shouldShowPhoneBanner) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
          {/* Email Verification Banner */}
          {shouldShowEmailBanner && (
            <VerificationBanner 
              user={user} 
              onVerified={handleEmailVerified}
            />
          )}
          
          {/* Phone Verification Banner */}
          {shouldShowPhoneBanner && (
            <PhoneVerificationBanner 
              user={user} 
              isRequired={user.role === 'HOST'}
              onVerified={handlePhoneVerified}
            />
          )}
        </div>
      )}
      {children}
    </main>
  );
}