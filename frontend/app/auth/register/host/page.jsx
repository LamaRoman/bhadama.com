"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import { api } from "../../../../utils/api";
import SocialLoginButtons from "../../../../components/SocialLoginButtons.jsx";

function HostRegisterContent() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "HOST", // HOST role for this page
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasNumber: false,
  });

  // Redirect if already logged in as host
  useEffect(() => {
    if (user && user.role === "HOST") {
      router.push("/host/dashboard");
    }
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Update password strength indicators
    if (name === "password") {
      setPasswordStrength({
        hasMinLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
      });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      if (data.error) {
        setMessage(data.error);
      } else {
        login(data.user, data.token);
        setMessage("Registration successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/host/dashboard");
        }, 1000);
      }
    } catch (error) {
      setMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Host Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            🏠 Become a Host
          </span>
        </div>

        <h2 className="text-center text-3xl font-bold text-gray-900">
          Start earning with your space
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          List your backyard, pool, garden, or any outdoor space
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow border border-gray-200">
          {/* Google Login - role="HOST" for host signup */}
          <SocialLoginButtons role="HOST" />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Message */}
            {message && (
              <div
                className={`px-4 py-3 rounded-lg text-sm ${
                  message.includes("successful")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}

              {/* Password Strength Indicators */}
              <div className="mt-2 space-y-1">
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.hasMinLength
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.hasMinLength ? "✓" : "○"}
                  </span>
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.hasUppercase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.hasUppercase ? "✓" : "○"}
                  </span>
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.hasNumber
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span className="mr-2">
                    {passwordStrength.hasNumber ? "✓" : "○"}
                  </span>
                  One number
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-emerald-600 hover:underline"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-emerald-600 hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 shadow-lg"
            >
              {isLoading ? "Creating account..." : "Start Hosting"}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-2">
              Why host with us?
            </h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>✓ Set your own prices and availability</li>
              <li>✓ Get paid securely for every booking</li>
              <li>✓ 24/7 support for hosts</li>
            </ul>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-emerald-600 hover:text-emerald-500"
              >
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Just want to book venues?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Sign up as Guest
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HostRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HostRegisterContent />
    </Suspense>
  );
}
