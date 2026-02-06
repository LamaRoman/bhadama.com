// __tests__/components/SocialLoginButtons.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SocialLoginButtons from '@/components/SocialLoginButtons';

// Suppress JSDOM navigation error for this test file
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Not implemented: navigation')) return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('SocialLoginButtons - Rendering', () => {
  it('should render Google login button', () => {
    render(<SocialLoginButtons />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('should render Google icon', () => {
    const { container } = render(<SocialLoginButtons />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have proper button styling', () => {
    render(<SocialLoginButtons />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('bg-white');
  });
});

describe('SocialLoginButtons - Click Behavior', () => {
  it('should attempt navigation to Google OAuth with default USER role', () => {
    // We test the click triggers and logs show correct URL
    // Navigation itself is not supported in JSDOM
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(<SocialLoginButtons />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);

    expect(consoleSpy).toHaveBeenCalledWith(
      '🔵 [FRONTEND] Full redirect URL:',
      expect.stringContaining('/api/auth/google?role=USER')
    );
    
    consoleSpy.mockRestore();
  });

  it('should attempt navigation with HOST role when specified', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(<SocialLoginButtons role="HOST" />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);

    expect(consoleSpy).toHaveBeenCalledWith(
      '🔵 [FRONTEND] Full redirect URL:',
      expect.stringContaining('role=HOST')
    );
    
    consoleSpy.mockRestore();
  });

  it('should attempt navigation with ADMIN role when specified', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(<SocialLoginButtons role="ADMIN" />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);

    expect(consoleSpy).toHaveBeenCalledWith(
      '🔵 [FRONTEND] Full redirect URL:',
      expect.stringContaining('role=ADMIN')
    );
    
    consoleSpy.mockRestore();
  });

  it('should use correct backend URL', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(<SocialLoginButtons />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);

    expect(consoleSpy).toHaveBeenCalledWith(
      '🔵 [FRONTEND] BACKEND_URL:',
      'http://localhost:5001'
    );
    
    consoleSpy.mockRestore();
  });
});

describe('SocialLoginButtons - Accessibility', () => {
  it('should have type="button" to prevent form submission', () => {
    render(<SocialLoginButtons />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should be focusable', () => {
    render(<SocialLoginButtons />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
