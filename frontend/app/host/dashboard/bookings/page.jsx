"use client";

import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../hooks/useAuth";
import Navbar from "../../../../components/Navbar";
import { useEffect } from "react";

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await api("/host/bookings");
        setBookings(data);
      } catch (err) {
        console.error(err);
        setBookings([]);
      }
    };
    fetchBookings();
  }, []);

  return (
    <ProtectedRoute user={user} role="HOST">
      <div>
        <Navbar />
        <main className="p-10">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="mt-2 text-gray-700">
            Here you can view all your bookings.
          </p>

         {bookings.length === 0?(
          <p>No bookings yet.</p>
         ):(
          <div className="space-y-4 mt-4">
            {bookings.map((b)=>(
              <div key={b.id} className="border p-4 rounded">
                <h2 className="font-semibold">
                  {b.listingTitle}
                </h2>
                <p>Booked by: {b.userName}</p>
                <p>Date: {b.date}</p>
              </div>
            ))}
          </div>
         )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
