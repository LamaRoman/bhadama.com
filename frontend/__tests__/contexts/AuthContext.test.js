// __tests__/contexts/AuthContext.test.js
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createMockUser } from '../../test-helpers/testUtils';

const TestComponent = () => {
  const {
    user,
    loading,
    isAuthenticated,
    sessionError,
    login,
    logout,
    register,
    refreshUser,
    updateUser,
    forgotPassword,
    resetPassword,
    clearSessionError,
  } = useAuth();

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password');
    } catch (e) {
      // Error handled
    }
  };

  const handleRegister = async () => {
    try {
      await register({ email: 'new@example.com', password: 'Password123!', firstName: 'Test', lastName: 'User' });
    } catch (e) {
      // Error handled
    }
  };

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="session-error">{sessionError || 'none'}</div>
      
      <button onClick={handleLogin} data-testid="login-btn">Login</button>
      <button onClick={() => logout()} data-testid="logout-btn">Logout</button>
      <button onClick={handleRegister} data-testid="register-btn">Register</button>
      <button onClick={() => refreshUser()} data-testid="refresh-btn">Refresh</button>
      <button onClick={() => updateUser({ firstName: 'Updated' })} data-testid="update-btn">Update</button>
      <button onClick={() => forgotPassword('test@example.com')} data-testid="forgot-btn">Forgot Password</button>
      <button onClick={() => resetPassword('token123', 'newPassword')} data-testid="reset-btn">Reset Password</button>
      <button onClick={() => clearSessionError()} data-testid="clear-error-btn">Clear Error</button>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext - Initial State', () => {
  it('should start with loading false after initialization', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('should start with no user when no stored session', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('should restore user from localStorage if available', async () => {
    const mockUser = createMockUser();
    localStorage.setItem('accessToken', 'stored-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toContainHTML(mockUser.email);
    });
  });
});

describe('AuthContext - Login', () => {
  const mockUser = createMockUser();

  it('should login successfully', async () => {
    const user = userEvent.setup();
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser,
      })),
      headers: new Headers(),
    });

    renderWithAuth();

    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toContainHTML(mockUser.email);
    });

    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
  });

  it('should handle login failure with invalid credentials', async () => {
    const user = userEvent.setup();
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      }),
      text: () => Promise.resolve(JSON.stringify({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      })),
      headers: new Headers(),
    });

    renderWithAuth();

    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });
});

describe('AuthContext - Logout', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('refreshToken', 'test-refresh');
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  it('should logout successfully', async () => {
    const user = userEvent.setup();
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
      headers: new Headers(),
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    await user.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('AuthContext - Registration', () => {
  const mockUser = createMockUser();

  it('should register successfully', async () => {
    const user = userEvent.setup();
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser,
        message: 'Registration successful',
      })),
      headers: new Headers(),
    });

    renderWithAuth();

    await user.click(screen.getByTestId('register-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toContainHTML(mockUser.email);
    });
  });
});

describe('AuthContext - useAuth outside provider', () => {
  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponentWithoutProvider = () => {
      useAuth();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
