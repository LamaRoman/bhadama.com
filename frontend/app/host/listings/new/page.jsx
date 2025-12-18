"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api.js";

// Predefined amenities
const AMENITIES = [
  "Swimming Pool",
  "BBQ Grill",
  "Fire Pit",
  "Outdoor Kitchen",
  "Playground",
  "Parking Available",
  "Restrooms",
  "WiFi",
  "Covered Area",
  "Pet Friendly",
  "Sports Court",
  "Garden/Lawn",
];

export default function NewListing() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    
    // Pricing (enable what you offer)
    hourlyRate: "",
    halfDayRate: "",
    fullDayRate: "",
    
    // Constraints
    minHours: "2",
    maxHours: "12",
    capacity: "",
    
    // Operating hours (simplified - same for all days)
    operatingStart: "08:00",
    operatingEnd: "20:00",
    
    status: "ACTIVE"
  });

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);

    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!form.hourlyRate && !form.halfDayRate && !form.fullDayRate) {
      setError("Please set at least one pricing option");
      setLoading(false);
      return;
    }

    try {
      // Prepare listing data
      const listingData = {
        ...form,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        halfDayRate: form.halfDayRate ? parseFloat(form.halfDayRate) : null,
        fullDayRate: form.fullDayRate ? parseFloat(form.fullDayRate) : null,
        minHours: parseInt(form.minHours),
        maxHours: parseInt(form.maxHours),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        amenities: selectedAmenities,
        operatingHours: {
          monday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          tuesday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          wednesday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          thursday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          friday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          saturday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
          sunday: { start: form.operatingStart, end: form.operatingEnd, closed: false },
        }
      };

      // 1️⃣ Create listing
      const createRes = await api("/api/host/listings", {
        method: "POST",
        body: listingData,
      });

      if (createRes.error) {
        setError(createRes.error);
        setLoading(false);
        return;
      }

      const listingId = createRes.listing?.id || createRes.id;

      if (!listingId) {
        setError("Failed to create listing - no ID returned");
        setLoading(false);
        return;
      }

      // 2️⃣ Upload images
      if (files.length > 0) {
        const formData = new FormData();
        for (const file of files) {
          formData.append("images", file);
        }

        const uploadRes = await api(`/api/host/listings/${listingId}/images`, {
          method: "POST",
          body: formData,
        });

        if (uploadRes.error) {
          setError(uploadRes.error);
          setLoading(false);
          return;
        }
      }

      setSuccess("Listing created successfully!");
      setTimeout(() => {
        router.push("/host/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Server error, please try again");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-5">
        
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
          <h1 className="text-3xl font-bold text-gray-900">List Your Yard</h1>
          <p className="text-gray-600 mt-1">Share your space for events, parties, and gatherings</p>
        </div>

        {/* Alerts */}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spacious Backyard with Pool & BBQ"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe your yard, perfect events, rules, and what makes it special..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of guests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pricing</h2>
            <p className="text-sm text-gray-600 mb-4">Set rates for different rental durations (enable at least one)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hourly Rate
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="25.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    value={form.hourlyRate}
                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Per hour</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Half Day Rate
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="80.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    value={form.halfDayRate}
                    onChange={(e) => setForm({ ...form, halfDayRate: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">4 hours</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Day Rate
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="150.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    value={form.fullDayRate}
                    onChange={(e) => setForm({ ...form, fullDayRate: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">8+ hours</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Hours
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  value={form.minHours}
                  onChange={(e) => setForm({ ...form, minHours: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Hours
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  value={form.maxHours}
                  onChange={(e) => setForm({ ...form, maxHours: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Amenities Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Amenities</h2>
            <p className="text-sm text-gray-600 mb-4">What does your yard offer?</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    selectedAmenities.includes(amenity)
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Operating Hours</h2>
            <p className="text-sm text-gray-600 mb-4">When is your yard available?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opens At
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  value={form.operatingStart}
                  onChange={(e) => setForm({ ...form, operatingStart: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Closes At
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  value={form.operatingEnd}
                  onChange={(e) => setForm({ ...form, operatingEnd: e.target.value })}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Same hours will apply to all days</p>
          </div>

          {/* Photos Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Photos</h2>
            <p className="text-sm text-gray-600 mb-4">Show guests what your yard looks like</p>
            
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Click to upload photos</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Listing...
              </span>
            ) : (
              "Create Listing"
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Hosting Tips</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Offer competitive hourly rates for flexible bookings</li>
                <li>• Highlight unique features (pool, BBQ, fire pit)</li>
                <li>• Set clear rules and capacity limits</li>
                <li>• Include high-quality photos of your space</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}