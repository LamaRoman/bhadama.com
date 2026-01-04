"use client";

import { useParams } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import ListingForm from "../../../dashboard/components/ListingForm";

export default function EditListingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  return (
    <ListingForm 
      mode="edit" 
      listingId={id} 
      isAdmin={isAdmin}
    />
  );
}