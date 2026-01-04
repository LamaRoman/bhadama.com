"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../utils/api";
import { toast, Toaster } from "react-hot-toast";
import {
  ArrowLeft, Save, Trash2, Eye, Upload, X, Plus,
  MapPin, DollarSign, Users, Clock, Image as ImageIcon,
  CheckCircle, Loader2, AlertTriangle, Shield,
} from "lucide-react";

// Predefined amenities
const AMENITIES = [
  "Swimming Pool", "BBQ Grill", "Fire Pit", "Outdoor Kitchen",
  "Playground", "Parking Available", "Restrooms", "WiFi",
  "Covered Area", "Pet Friendly", "Sports Court", "Garden/Lawn",
  "Air Conditioning", "Heating", "Security Camera", "First Aid Kit",
  "Sound System", "Projector", "Lighting", "Changing Room",
];

// Status options - different for host vs admin
const getStatusOptions = (isAdmin) => {
  const baseOptions = [
    { value: "ACTIVE", label: "Active", color: "green", description: "Visible to guests" },
    { value: "INACTIVE", label: "Inactive", color: "gray", description: "Hidden from search" },
  ];
  
  // Only admins can set/see PENDING status
  if (isAdmin) {
    baseOptions.push(
      { value: "PENDING", label: "Pending", color: "yellow", description: "Awaiting approval" },
      { value: "REJECTED", label: "Rejected", color: "red", description: "Not approved" }
    );
  }
  
  return baseOptions;
};

/**
 * Shared Listing Form Component
 * @param {string} mode - "create" or "edit"
 * @param {string} listingId - Required for edit mode
 * @param {boolean} isAdmin - Show admin-only controls
 */
export default function ListingForm({ mode = "create", listingId = null, isAdmin = false }) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  // Loading states
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Form data
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    address: "",
    hourlyRate: "",
    halfDayRate: "",
    fullDayRate: "",
    capacity: "",
    minCapacity: "1",
    includedGuests: "",
    extraGuestCharge: "",
    minHours: "2",
    maxHours: "12",
    size: "",
    status: "ACTIVE",
    operatingStart: "08:00",
    operatingEnd: "20:00",
  });

  // Amenities & Rules
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");

  // Images
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  // Admin fields
  const [adminFields, setAdminFields] = useState({
    featured: false,
    featuredUntil: "",
    adminNote: "",
  });

  // Original data for reference
  const [originalData, setOriginalData] = useState(null);

  // Fetch existing listing for edit mode
  const fetchListing = useCallback(async () => {
    if (!isEditMode || !listingId) return;

    try {
      setIsLoading(true);
      const endpoint = isAdmin
        ? `/api/admin/listings/${listingId}`
        : `/api/host/listings/${listingId}`;

      const data = await api(endpoint);

      if (!data || data.error) {
        toast.error("Listing not found");
        router.back();
        return;
      }

      // Populate form
      setForm({
        title: data.title || "",
        description: data.description || "",
        location: data.location || "",
        address: data.address || "",
        hourlyRate: data.hourlyRate?.toString() || "",
        halfDayRate: data.halfDayRate?.toString() || "",
        fullDayRate: data.fullDayRate?.toString() || "",
        capacity: data.capacity?.toString() || "",
        minCapacity: data.minCapacity?.toString() || "1",
        includedGuests: data.includedGuests?.toString() || "",
        extraGuestCharge: data.extraGuestCharge?.toString() || "",
        minHours: data.minHours?.toString() || "2",
        maxHours: data.maxHours?.toString() || "12",
        size: data.size || "",
        status: data.status || "ACTIVE",
        operatingStart: data.operatingHours?.monday?.start || "08:00",
        operatingEnd: data.operatingHours?.monday?.end || "20:00",
      });

      setSelectedAmenities(data.amenities || []);
      setRules(data.rules || []);
      setExistingImages(data.images || []);
      setOriginalData(data);

      // Admin fields
      if (isAdmin) {
        setAdminFields({
          featured: data.featured || false,
          featuredUntil: data.featuredUntil ? data.featuredUntil.split("T")[0] : "",
          adminNote: data.adminNote || "",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load listing");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, listingId, isAdmin, router]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Toggle amenity
  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  // Rules management
  const addRule = () => {
    if (newRule.trim()) {
      setRules(prev => [...prev, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (index) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  // Image handling
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...files]);

    const previews = files.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeNewImage = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imageId) => {
    setDeletedImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Delete listing
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const endpoint = isAdmin
        ? `/api/admin/listings/${listingId}`
        : `/api/host/listings/${listingId}`;

      await api(endpoint, { method: "DELETE" });

      toast.success("Listing deleted");
      router.push(isAdmin ? "/admin/dashboard" : "/host/dashboard");
    } catch (error) {
      toast.error("Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!form.hourlyRate && !form.halfDayRate && !form.fullDayRate) {
      toast.error("Please set at least one pricing option");
      return;
    }
    if (!form.capacity) {
      toast.error("Capacity is required");
      return;
    }

    setIsSaving(true);
    setUploadProgress(isEditMode ? "Saving changes..." : "Creating listing...");

    try {
      // Prepare data
      const listingData = {
        title: form.title,
        description: form.description,
        location: form.location,
        address: form.address || null,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        halfDayRate: form.halfDayRate ? parseFloat(form.halfDayRate) : null,
        fullDayRate: form.fullDayRate ? parseFloat(form.fullDayRate) : null,
        capacity: parseInt(form.capacity),
        minCapacity: parseInt(form.minCapacity) || 1,
        includedGuests: form.includedGuests ? parseInt(form.includedGuests) : null,
        extraGuestCharge: form.extraGuestCharge ? parseFloat(form.extraGuestCharge) : null,
        minHours: parseInt(form.minHours) || 2,
        maxHours: parseInt(form.maxHours) || 12,
        size: form.size || null,
        status: form.status,
        amenities: selectedAmenities,
        rules: rules,
        operatingHours: {
          monday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          tuesday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          wednesday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          thursday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          friday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          saturday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          sunday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
        },
      };

      // Add admin fields
      if (isAdmin) {
        listingData.featured = adminFields.featured;
        listingData.featuredUntil = adminFields.featuredUntil || null;
        listingData.adminNote = adminFields.adminNote || null;
      }

      let savedListingId = listingId;

      if (isEditMode) {
        // Update existing listing
        const endpoint = isAdmin
          ? `/api/admin/listings/${listingId}`
          : `/api/host/listings/${listingId}`;

        await api(endpoint, {
          method: "PUT",
          body: JSON.stringify(listingData),
        });

        setUploadProgress("✓ Changes saved!");
      } else {
        // Create new listing
        const createRes = await api("/api/host/listings", {
          method: "POST",
          body: listingData,
        });

        if (createRes.error) {
          throw new Error(createRes.error);
        }

        savedListingId = createRes.listing?.id || createRes.id;
        
        if (!savedListingId) {
          throw new Error("Failed to create listing - no ID returned");
        }
        
        setUploadProgress("✓ Listing created!");
      }

      // Upload new images
      if (newFiles.length > 0 && savedListingId) {
        setUploadProgress(`Uploading ${newFiles.length} image(s)...`);

        const formData = new FormData();
        newFiles.forEach(file => formData.append("images", file));

        try {
          await api(`/api/host/listings/${savedListingId}/images`, {
            method: "POST",
            body: formData,
          });
          setUploadProgress(`✓ ${newFiles.length} image(s) uploaded!`);
        } catch (imgError) {
          console.error("Image upload error:", imgError);
          toast.error("Some images failed to upload");
        }
      }

      // Delete marked images (edit mode only)
      if (isEditMode && deletedImageIds.length > 0) {
        for (const imageId of deletedImageIds) {
          try {
            await api(`/api/host/listings/${listingId}/images/${imageId}`, {
              method: "DELETE",
            });
          } catch (delError) {
            console.error("Image delete error:", delError);
          }
        }
      }

      // Success
      toast.success(isEditMode ? "Listing updated!" : "🎉 Listing published!");
      setUploadProgress("");

      // Reset new files
      setNewFiles([]);
      setNewPreviews([]);
      setDeletedImageIds([]);

      // Redirect or refresh
      if (isEditMode) {
        fetchListing(); // Refresh data
      } else {
        setTimeout(() => {
          router.push("/host/dashboard");
        }, 1500);
      }

    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save");
      setUploadProgress("");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isEditMode ? "Edit Listing" : "Create New Listing"}
                </h1>
                <p className="text-sm text-gray-500">
                  {isAdmin && <span className="text-purple-600 font-medium">Admin Mode • </span>}
                  {isEditMode ? `ID: ${listingId}` : "Fill in the details below"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEditMode && (
                <a
                  href={`/public/listings/${listingId}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Publish Listing"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {uploadProgress && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {!uploadProgress.startsWith("✓") && (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            )}
            {uploadProgress.startsWith("✓") && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className="text-sm font-medium text-blue-900">{uploadProgress}</span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g., Spacious Backyard with Pool & BBQ"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe your space, perfect events, rules, and what makes it special..."
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="City, State"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Street address (optional)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Size (optional)
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                      placeholder="e.g., 500 sq ft, 1 acre"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  <DollarSign className="w-5 h-5 inline mr-2" />
                  Pricing
                </h2>
                <p className="text-sm text-gray-600 mb-6">Set rates for different rental durations (at least one required)</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hourly Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={form.hourlyRate}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="500"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Per hour</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Half Day Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                      <input
                        type="number"
                        name="halfDayRate"
                        value={form.halfDayRate}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="1500"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">4 hours</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Day Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                      <input
                        type="number"
                        name="fullDayRate"
                        value={form.fullDayRate}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="3000"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">8+ hours</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Included Guests
                    </label>
                    <input
                      type="number"
                      name="includedGuests"
                      value={form.includedGuests}
                      onChange={handleChange}
                      min="1"
                      placeholder="10"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Before extra charges apply</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Extra Guest Charge
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                      <input
                        type="number"
                        name="extraGuestCharge"
                        value={form.extraGuestCharge}
                        onChange={handleChange}
                        min="0"
                        placeholder="50"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Per extra guest</p>
                  </div>
                </div>
              </section>

              {/* Capacity & Hours */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  <Users className="w-5 h-5 inline mr-2" />
                  Capacity & Hours
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Capacity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={form.capacity}
                      onChange={handleChange}
                      min="1"
                      placeholder="50"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min Capacity
                    </label>
                    <input
                      type="number"
                      name="minCapacity"
                      value={form.minCapacity}
                      onChange={handleChange}
                      min="1"
                      placeholder="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min Hours
                    </label>
                    <input
                      type="number"
                      name="minHours"
                      value={form.minHours}
                      onChange={handleChange}
                      min="1"
                      max="24"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Hours
                    </label>
                    <input
                      type="number"
                      name="maxHours"
                      value={form.maxHours}
                      onChange={handleChange}
                      min="1"
                      max="24"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Opens At
                    </label>
                    <input
                      type="time"
                      name="operatingStart"
                      value={form.operatingStart}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Closes At
                    </label>
                    <input
                      type="time"
                      name="operatingEnd"
                      value={form.operatingEnd}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Same hours will apply to all days</p>
              </section>

              {/* Images */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  <ImageIcon className="w-5 h-5 inline mr-2" />
                  Photos
                </h2>
                <p className="text-sm text-gray-600 mb-6">Show guests what your space looks like</p>

                {/* Existing Images (edit mode) */}
                {existingImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {existingImages.map((img, index) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={img.url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => markImageForDeletion(img.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New image previews */}
                {newPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {newPreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-green-400">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          New
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload photos</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {deletedImageIds.length > 0 && (
                  <p className="text-sm text-amber-600 mt-4">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {deletedImageIds.length} image(s) will be deleted when you save
                  </p>
                )}
              </section>

              {/* Amenities */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Amenities</h2>
                <p className="text-sm text-gray-600 mb-6">What does your space offer?</p>

                <div className="flex flex-wrap gap-3">
                  {AMENITIES.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedAmenities.includes(amenity)
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {selectedAmenities.includes(amenity) && (
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                      )}
                      {amenity}
                    </button>
                  ))}
                </div>
              </section>

              {/* Rules */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">House Rules</h2>
                <p className="text-sm text-gray-600 mb-6">Set expectations for guests</p>

                <div className="space-y-3 mb-4">
                  {rules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="flex-1 text-gray-700">{rule}</span>
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add a rule..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRule())}
                  />
                  <button
                    type="button"
                    onClick={addRule}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column - Status & Admin */}
            <div className="space-y-6">
              {/* Status */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Status</h2>

                <div className="space-y-3">
                  {getStatusOptions(isAdmin).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.status === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={form.status === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.status === option.value
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}>
                        {form.status === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Show current status if it's PENDING/REJECTED and user is not admin */}
                {!isAdmin && (form.status === "PENDING" || form.status === "REJECTED") && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    form.status === "PENDING" ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"
                  }`}>
                    <p className={`text-sm font-medium ${
                      form.status === "PENDING" ? "text-yellow-800" : "text-red-800"
                    }`}>
                      {form.status === "PENDING" 
                        ? "⏳ Your listing is pending admin approval" 
                        : "❌ Your listing was not approved. Please contact support."}
                    </p>
                  </div>
                )}
              </section>

              {/* Admin Controls */}
              {isAdmin && (
                <section className="bg-purple-50 rounded-2xl border border-purple-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-purple-900">Admin Controls</h2>
                  </div>

                  <div className="space-y-5">
                    {/* Featured Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adminFields.featured}
                        onChange={(e) => setAdminFields(prev => ({ ...prev, featured: e.target.checked }))}
                        className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-purple-900">Featured Listing</p>
                        <p className="text-sm text-purple-600">Show on homepage</p>
                      </div>
                    </label>

                    {/* Featured Until */}
                    {adminFields.featured && (
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">
                          Featured Until
                        </label>
                        <input
                          type="date"
                          value={adminFields.featuredUntil}
                          onChange={(e) => setAdminFields(prev => ({ ...prev, featuredUntil: e.target.value }))}
                          className="w-full px-4 py-2 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* Admin Note */}
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-2">
                        Admin Note (internal)
                      </label>
                      <textarea
                        value={adminFields.adminNote}
                        onChange={(e) => setAdminFields(prev => ({ ...prev, adminNote: e.target.value }))}
                        placeholder="Internal notes..."
                        rows={3}
                        className="w-full px-4 py-2 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    {/* Host Info */}
                    {originalData?.host && (
                      <div className="pt-4 border-t border-purple-200">
                        <p className="text-sm text-purple-600 mb-2">Host Information</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                            <span className="text-purple-700 font-medium">
                              {originalData.host.name?.[0] || "H"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900">{originalData.host.name}</p>
                            <p className="text-sm text-purple-600">{originalData.host.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Quick Links (edit mode) */}
              {isEditMode && (
                <section className="bg-white rounded-2xl border p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
                  <div className="space-y-3">
                    <a
                      href={`/host/listings/${listingId}/availability`}
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Manage Availability</span>
                    </a>
                    <a
                      href={`/public/listings/${listingId}`}
                      target="_blank"
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-700">View Public Page</span>
                    </a>
                  </div>
                </section>
              )}

              {/* Danger Zone (edit mode) */}
              {isEditMode && (
                <section className="bg-red-50 rounded-2xl border border-red-200 p-6">
                  <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h2>

                  <p className="text-sm text-red-600 mb-4">
                    Once deleted, this listing cannot be recovered.
                  </p>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete Listing"}
                  </button>
                </section>
              )}

              {/* Help Section (create mode) */}
              {!isEditMode && (
                <section className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                  <h2 className="text-lg font-bold text-blue-900 mb-3">💡 Hosting Tips</h2>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Offer competitive hourly rates</li>
                    <li>• Highlight unique features (pool, BBQ, fire pit)</li>
                    <li>• Set clear rules and capacity limits</li>
                    <li>• Include high-quality photos</li>
                    <li>• Respond quickly to booking requests</li>
                  </ul>
                </section>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}