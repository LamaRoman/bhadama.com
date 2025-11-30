"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api.js";

export default function ProfilePage() {
  const [user, setUser] = useState({ username: "", email: "" });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/auth/login");

    const fetchProfile = async () => {
      try {
        const profileData = await api("/api/profile");
        if (profileData.user) setUser(profileData.user);
        else router.push("/auth/login");
      } catch (err) {
        console.error(err);
        router.push("/auth/login");
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const updated = await api("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, email: user.email }),
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

      <div className="flex flex-col w-full max-w-md gap-4">
        <input
          type="text"
          value={user.username}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
          placeholder="Username"
          className="border p-2 rounded"
        />
        <input
          type="email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Email"
          className="border p-2 rounded"
        />
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
