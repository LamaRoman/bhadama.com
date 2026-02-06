// __tests__/components/ProtectedRoute.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute, PublicRoute, withAuth, withPublicOnly } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { createMockUser, createMockHost, createMockAdmin } from '../../test-helpers/testUtils';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// ==========================================
// PROTECTED ROUTE TESTS
// ==========================================

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking auth', () => {
      useAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Users', () => {
    it('should redirect unauthenticated users to login', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login')
        );
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should save current path for redirect after login', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/test-path');
      });
    });
  });

  describe('Authenticated Users', () => {
    it('should render children for authenticated users', async () => {
      const mockUser = createMockUser();
      
      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow users with matching role', async () => {
      const mockHost = createMockHost();
      
      useAuth.mockReturnValue({
        user: mockHost,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <ProtectedRoute allowedRoles={['HOST']}>
          <div>Host Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Host Content')).toBeInTheDocument();
      });
    });

    it('should redirect users without matching role', async () => {
      const mockUser = createMockUser();
      
      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
          <div>Admin Only Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });

    it('should redirect HOST to host dashboard when accessing admin routes', async () => {
      const mockHost = createMockHost();
      
      useAuth.mockReturnValue({
        user: mockHost,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <div>Admin Only</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/host/dashboard');
      });
    });
  });
});

// ==========================================
// PUBLIC ROUTE TESTS
// ==========================================

describe('PublicRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Unauthenticated Users', () => {
    it('should render children for unauthenticated users', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      render(
        <PublicRoute>
          <div>Login Form</div>
        </PublicRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Form')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated Users', () => {
    it('should redirect regular users to home', async () => {
      const mockUser = createMockUser();
      
      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <PublicRoute>
          <div>Login Form</div>
        </PublicRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('should redirect hosts to host dashboard', async () => {
      const mockHost = createMockHost();
      
      useAuth.mockReturnValue({
        user: mockHost,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <PublicRoute>
          <div>Login Form</div>
        </PublicRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/host/dashboard');
      });
    });

    it('should redirect admins to admin dashboard', async () => {
      const mockAdmin = createMockAdmin();
      
      useAuth.mockReturnValue({
        user: mockAdmin,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <PublicRoute>
          <div>Login Form</div>
        </PublicRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });
});

// ==========================================
// HOC TESTS
// ==========================================

describe('withAuth HOC', () => {
  it('should wrap component with ProtectedRoute', async () => {
    const mockUser = createMockUser();
    
    useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    const TestComponent = () => <div>Dashboard Content</div>;
    const WrappedComponent = withAuth(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });
});

describe('withPublicOnly HOC', () => {
  it('should wrap component with PublicRoute', async () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    });

    const TestComponent = () => <div>Login Form</div>;
    const WrappedComponent = withPublicOnly(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(screen.getByText('Login Form')).toBeInTheDocument();
    });
  });
});
