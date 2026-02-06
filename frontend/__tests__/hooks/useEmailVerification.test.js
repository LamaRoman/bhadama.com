// __tests__/hooks/useEmailVerification.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailVerification } from '@/hooks/useEmailVerification';

describe('useEmailVerification - Initial State', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => useEmailVerification());

    expect(result.current.showOtpInput).toBe(false);
    expect(result.current.otp).toBe('');
    expect(result.current.isSending).toBe(false);
    expect(result.current.isVerifying).toBe(false);
    expect(result.current.countdown).toBe(0);
    expect(result.current.message).toBe('');
    expect(result.current.messageType).toBe('info');
    expect(result.current.isVerified).toBe(false);
  });

  it('should provide all expected methods', () => {
    const { result } = renderHook(() => useEmailVerification());

    expect(typeof result.current.sendCode).toBe('function');
    expect(typeof result.current.verifyOtp).toBe('function');
    expect(typeof result.current.setOtp).toBe('function');
  });
});

describe('useEmailVerification - Send Code', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should send verification code successfully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        message: 'Verification code sent to your email!',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.showOtpInput).toBe(true);
    expect(result.current.countdown).toBe(60);
    expect(result.current.messageType).toBe('success');
    expect(result.current.message).toContain('Verification code sent');
  });

  it('should handle send code error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({
        error: 'Server error',
        code: 'SERVER_ERROR',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.messageType).toBe('error');
    expect(result.current.showOtpInput).toBe(false);
  });

  it('should not send during countdown', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"message": "Sent"}'),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.countdown).toBe(60);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.sendCode();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('useEmailVerification - Countdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should countdown after sending code', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"message": "Sent"}'),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.countdown).toBe(60);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.countdown).toBe(59);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.countdown).toBe(58);
  });
});

describe('useEmailVerification - Verify OTP', () => {
  it('should verify OTP successfully', async () => {
    const onVerified = jest.fn();
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        message: 'Email verified successfully!',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification(onVerified));

    await act(async () => {
      await result.current.verifyOtp('123456');
    });

    expect(result.current.isVerified).toBe(true);
    expect(result.current.messageType).toBe('success');
    expect(result.current.message).toContain('verified');
  });

  it('should not verify with invalid OTP length', async () => {
    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.verifyOtp('12345');
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle verification error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({
        error: 'Invalid verification code',
        code: 'INVALID_OTP',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification());

    await act(async () => {
      await result.current.verifyOtp('123456');
    });

    expect(result.current.isVerified).toBe(false);
    expect(result.current.messageType).toBe('error');
    expect(result.current.otp).toBe('');
  });

  it('should handle "already verified" as success', async () => {
    const onVerified = jest.fn();
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({
        error: 'Email already verified',
        code: 'ALREADY_VERIFIED',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useEmailVerification(onVerified));

    await act(async () => {
      await result.current.verifyOtp('123456');
    });

    expect(result.current.isVerified).toBe(true);
    expect(result.current.messageType).toBe('success');
  });
});

describe('useEmailVerification - Set OTP', () => {
  it('should update OTP value', () => {
    const { result } = renderHook(() => useEmailVerification());

    act(() => {
      result.current.setOtp('123');
    });

    expect(result.current.otp).toBe('123');
  });
});
