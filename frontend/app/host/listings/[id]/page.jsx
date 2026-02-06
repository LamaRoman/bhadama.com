"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// This page redirects to the edit page
// Old URL: /host/listings/[id]
// New URL: /host/listings/[id]/edit
export default function ListingRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/host/listings/${id}/edit`);
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}