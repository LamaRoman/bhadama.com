"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext.js";
import { api, getErrorMessage } from "../../../utils/api.js";
import { CheckCircle, Shield, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user: authUser, logout, refreshUser } = useAuth();
  const [user, setUser] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    profilePhoto: "",
    lastNameChange: null,
    emailVerified: false,
    phoneVerified: false,
    role: "USER",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Calculate days until name can be changed again
  const getDaysUntilNameChange = () => {
    if (!user.lastNameChange) return 0;
    const lastChange = new Date(user.lastNameChange);
    const now = new Date();
    const daysSinceChange = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysSinceChange;
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  const canChangeName = getDaysUntilNameChange() === 0;

  // Update password strength indicators
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: passwords.newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(passwords.newPassword),
      hasLowercase: /[a-z]/.test(passwords.newPassword),
      hasNumber: /[0-9]/.test(passwords.newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword),
    });
  }, [passwords.newPassword]);

  useEffect(() => {
    // Check if user is authenticated
    if (!authUser && !localStorage.getItem("token")) {
      router.push("/auth/login?redirect=/profile");
      return;
    }

    fetchProfile();
  }, [authUser, router]);

  const fetchProfile = async () => {
    try {
      const profileData = await api("/api/users/profile");

      if (profileData.error) {
        router.push("/auth/login");
        return;
      }

      setUser({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        profilePhoto: profileData.profilePhoto || "",
        lastNameChange: profileData.lastNameChange || null,
        emailVerified: profileData.emailVerified || false,
        phoneVerified: profileData.phoneVerified || false,
        role: profileData.role || "USER",
      });
    } catch (err) {
      console.error(err);
      // Handle auth errors
      if (err.code === "INVALID_TOKEN" || err.code === "TOKEN_EXPIRED" || err.code === "NO_TOKEN") {
        logout();
        router.push("/auth/login?redirect=/profile");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const data = await api("/api/users/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (data.error) {
        setError(data.error);
      } else {
        setUser({ ...user, profilePhoto: data.photoUrl });
        setSuccess("Profile photo updated successfully!");
        setPhotoFile(null);
        setPhotoPreview(null);
        // Refresh auth context
        refreshUser().catch(() => {});
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err) || "Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user.profilePhoto) return;

    const confirmed = window.confirm("Are you sure you want to remove your profile photo?");
    if (!confirmed) return;

    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    try {
      const data = await api("/api/users/remove-photo", {
        method: "DELETE",
      });

      if (data.error) {
        setError(data.error);
      } else {
        setUser({ ...user, profilePhoto: "" });
        setSuccess("Profile photo removed successfully!");
        refreshUser().catch(() => {});
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err) || "Failed to remove photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api("/api/users", {
        method: "PUT",
        body: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });

      if (response.error) {
        setError(response.error);
      } else {
        // Update local state with response
        if (response.user) {
          setUser(prev => ({
            ...prev,
            ...response.user,
          }));
        }
        
        // Refresh auth context
        refreshUser().catch(() => {});
        
        // Show appropriate success message
        if (response.user?.phone && !response.user?.phoneVerified) {
          setSuccess("Profile updated! Please verify your phone number.");
        } else {
          setSuccess("Profile updated successfully!");
        }
        
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err) || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = () => {
    const { newPassword, confirmPassword, currentPassword } = passwords;

    if (!currentPassword.trim()) {
      return "Current password is required";
    }

    if (newPassword.length < 8) {
      return "New password must be at least 8 characters long";
    }

    if (newPassword.length > 128) {
      return "Password must be less than 128 characters";
    }

    if (!/[a-z]/.test(newPassword)) {
      return "Password must contain at least one lowercase letter";
    }

    if (!/[A-Z]/.test(newPassword)) {
      return "Password must contain at least one uppercase letter";
    }

    if (!/[0-9]/.test(newPassword)) {
      return "Password must contain at least one number";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return "Password must contain at least one special character";
    }

    if (newPassword !== confirmPassword) {
      return "New passwords do not match";
    }

    if (currentPassword === newPassword) {
      return "New password must be different from current password";
    }

    return null;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setChangingPassword(true);
    setError("");
    setSuccess("");

    try {
      const response = await api("/api/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword,
        },
      });

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess("Password changed successfully!");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
      
      // Handle specific error codes
      if (err.code === "INVALID_CREDENTIALS") {
        setError("Current password is incorrect");
      } else {
        setError(getErrorMessage(err) || "Failed to change password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-3xl mx-auto px-5">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your profile and account preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Profile Photo Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Photo</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Current/Preview Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {photoPreview || user.profilePhoto ? (
                  <img
                    src={photoPreview || user.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
              {photoFile && (
                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                Upload a profile photo to help others recognize you
              </p>
              <p className="text-xs text-gray-500 mb-4">
                JPG, PNG or GIF. Max size 5MB.
              </p>
              
              <div className="flex gap-2">
                {!photoFile ? (
                  <>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    
                    {user.profilePhoto && (
                      <button
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      uploadingPhoto
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    }`}
                  >
                    {uploadingPhoto ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Photo
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Name Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                {!canChangeName && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    Can change in {getDaysUntilNameChange()} days
                  </span>
                )}
              </div>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                placeholder="Enter your full name"
                disabled={!canChangeName}
                className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all text-gray-900 ${
                  canChangeName
                    ? "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    : "border-gray-100 bg-gray-50 cursor-not-allowed text-gray-500"
                }`}
                required
              />
              {!canChangeName && (
                <p className="mt-2 text-xs text-gray-500">
                  Names can only be changed once every 30 days to prevent abuse
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                {user.emailVerified && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                required
              />
            </div>

            {/* Phone Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                {user.phoneVerified && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                {user.role === 'HOST' 
                  ? 'Phone verification is required for hosts to publish listings'
                  : 'Optional - for booking notifications and faster confirmations'}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                saving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-gray-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Password</h2>
                <p className="text-sm text-gray-500">Change your password</p>
              </div>
            </div>
            {!showPasswordSection && (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword} className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, newPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Indicators */}
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center text-xs ${passwordStrength.hasMinLength ? "text-green-600" : "text-gray-500"}`}>
                    <span className="mr-2">{passwordStrength.hasMinLength ? "✓" : "○"}</span>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-500"}`}>
                    <span className="mr-2">{passwordStrength.hasLowercase ? "✓" : "○"}</span>
                    One lowercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-500"}`}>
                    <span className="mr-2">{passwordStrength.hasUppercase ? "✓" : "○"}</span>
                    One uppercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                    <span className="mr-2">{passwordStrength.hasNumber ? "✓" : "○"}</span>
                    One number
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.hasSpecial ? "text-green-600" : "text-gray-500"}`}>
                    <span className="mr-2">{passwordStrength.hasSpecial ? "✓" : "○"}</span>
                    One special character (!@#$%^&*)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  required
                />
                {passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span> Passwords match
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswords({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setError("");
                  }}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    changingPassword
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {changingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing...
                    </span>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}