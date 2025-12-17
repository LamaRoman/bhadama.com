"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api.js";

export default function ProfilePage() {
  const [user, setUser] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileData = await api("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileData.user) {
          // Ensure all fields are strings
          setUser({
            username: profileData.user.username ?? "",
            email: profileData.user.email ?? "",
          });
        } else {
          router.push("/auth/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const token = localStorage.getItem("token");

    try {
      await api("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: user.username ?? "",
          email: user.email ?? "",
        }),
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

      <div className="flex flex-col w-full max-w-md gap-4">
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          value={user.username ?? ""}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
          placeholder="Username"
          className="border p-2 rounded"
        />
        <input
          type="email"
          value={user.email ?? ""}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Email"
          className="border p-2 rounded"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded text-white ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
