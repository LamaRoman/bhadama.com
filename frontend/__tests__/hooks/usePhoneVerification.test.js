// __tests__/hooks/usePhoneVerification.test.js
import { renderHook, act } from '@testing-library/react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';

describe('usePhoneVerification - Initial State', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => usePhoneVerification());

    expect(result.current.showOtpInput).toBe(false);
    expect(result.current.otp).toBe('');
    expect(result.current.isSending).toBe(false);
    expect(result.current.isVerifying).toBe(false);
    expect(result.current.countdown).toBe(0);
    expect(result.current.message).toBe('');
    expect(result.current.messageType).toBe('');
    expect(result.current.isVerified).toBe(false);
  });

  it('should provide all expected methods', () => {
    const { result } = renderHook(() => usePhoneVerification());

    expect(typeof result.current.sendCode).toBe('function');
    expect(typeof result.current.verifyCode).toBe('function');
    expect(typeof result.current.setOtp).toBe('function');
  });
});

describe('usePhoneVerification - Send Code', () => {
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
        message: 'Verification code sent!',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode('+9779812345678');
    });

    expect(result.current.showOtpInput).toBe(true);
    expect(result.current.countdown).toBe(60);
    expect(result.current.messageType).toBe('success');
    expect(result.current.message).toContain('Verification code sent');
  });

  it('should show error when no phone number provided', async () => {
    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode('');
    });

    expect(result.current.message).toBe('No phone number provided');
    expect(result.current.messageType).toBe('error');
    expect(result.current.showOtpInput).toBe(false);
  });

  it('should show error when phone number is null', async () => {
    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode(null);
    });

    expect(result.current.message).toBe('No phone number provided');
    expect(result.current.messageType).toBe('error');
  });

  it('should handle send code API error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode('+9779812345678');
    });

    expect(result.current.messageType).toBe('error');
    expect(result.current.message).toContain('Failed to send');
    expect(result.current.showOtpInput).toBe(false);
  });

  it('should handle rate limit with remainingSeconds', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        error: 'Too many requests',
        remainingSeconds: 45,
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode('+9779812345678');
    });

    expect(result.current.countdown).toBe(45);
    expect(result.current.messageType).toBe('error');
  });

  it('should handle rate limit with remainingMinutes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        error: 'Too many requests',
        remainingMinutes: 2,
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode('+9779812345678');
    });

    expect(result.current.countdown).toBe(120);
  });
});

describe('usePhoneVerification - Countdown', () => {
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
      text: () => Promise.resolve(JSON.stringify({
        message: 'Sent',
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendCode('+9779812345678');
    });

    expect(result.current.countdown).toBe(60);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.countdown).toBe(59);

    // Only advance 1 more second to avoid timing issues
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.countdown).toBe(58);
  });
});

describe('usePhoneVerification - Verify OTP', () => {
  it('should verify OTP successfully', async () => {
    const onVerified = jest.fn();
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        verified: true,
      })),
      headers: new Headers(),
    });

    const { result } = renderHook(() => usePhoneVerification(onVerified));

    act(() => {
      result.current.setOtp('123456');
    });

    await act(async () => {
      await result.current.verifyCode();
    });

    expect(result.current.isVerified).toBe(true);
    expect(result.current.messageType).toBe('success');
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it('should not verify with invalid OTP length', async () => {
    const { result } = renderHook(() => usePhoneVerification());

    act(() => {
      result.current.setOtp('12345');
    });

    await act(async () => {
      await result.current.verifyCode();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle verification API error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePhoneVerification());

    act(() => {
      result.current.setOtp('123456');
    });

    await act(async () => {
      await result.current.verifyCode();
    });

    expect(result.current.isVerified).toBe(false);
    expect(result.current.messageType).toBe('error');
    expect(result.current.otp).toBe('');
  });
});

describe('usePhoneVerification - Set OTP', () => {
  it('should update OTP value', () => {
    const { result } = renderHook(() => usePhoneVerification());

    act(() => {
      result.current.setOtp('123');
    });

    expect(result.current.otp).toBe('123');
  });
});
