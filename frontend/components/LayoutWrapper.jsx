'use client';

import { useAuth } from '@/contexts/AuthContext';
import VerificationBanner from '@/components/verification/VerificationBanner';
import { usePathname } from 'next/navigation';

export default function checkingReviewEligibilityapper({ children }) {
  const { user, refreshUser } = useAuth();
  const pathname = usePathname();

  console.log('🔍 checkingReviewEligibilityapper Debug:', {
    userExists: !!user,
    emailVerified: user?.emailVerified,
    pathname,
  });

  // Pages where we don't want to show the verification banner
  const excludedPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  const shouldShowBanner = !excludedPaths.includes(pathname);

  const handleEmailVerified = async () => {
    console.log('✅ Email verified successfully!');
    
    // Refresh user data to update emailVerified status
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Show verification banner if user is logged in, not verified, and not on excluded pages */}
      {user && !user.emailVerified && shouldShowBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <VerificationBanner 
            user={user} 
            onVerified={handleEmailVerified}
          />
        </div>
      )}
      
      {/* Page content */}
      {children}
    </main>
  );
}