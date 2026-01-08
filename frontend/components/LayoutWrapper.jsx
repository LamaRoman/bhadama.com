'use client';
import { useAuth } from '@/contexts/AuthContext';
import VerificationBanner from '@/components/verification/VerificationBanner';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }) {
  const { user, refreshUser } = useAuth();
  const pathname = usePathname();

  const excludedPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  
  // Only show banner if user exists, email not verified, and not on excluded pages
  const shouldShowBanner = user && 
                          !user.emailVerified && 
                          !user.email_verified &&
                          !excludedPaths.includes(pathname);

  const handleEmailVerified = async () => {
    try {
      await refreshUser();
      console.log('✅ User data refreshed after verification');
    } catch (error) {
      // ✅ Silently handle errors - user is already verified
      if (!error.message?.includes('already verified')) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  return (
    <main className="min-h-screen">
      {shouldShowBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <VerificationBanner 
            user={user} 
            onVerified={handleEmailVerified}
          />
        </div>
      )}
      {children}
    </main>
  );
}