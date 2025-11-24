"use client";
import { useEffect,useState } from "react";
import {api} from "../../utils/api.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { useAuth } from "../../../hooks/useAuth";
import Navbar from "../../../components/Navbar.jsx";

export default function AdminHosts() {
  const { user } = useAuth();
  const [hosts, setHosts] = useState([]);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const data = await api("/admin/hosts");
        setHosts(data);
      } catch (err) {
        console.error(err);
        setHosts([]);
      }
    };
    fetchHosts();
  }, []);

  return (
    <ProtectedRoute user={user} role="ADMIN">
      <div>
        <Navbar />
        <main className="p-10">
          <h1 className="text-2xl font-bold">Hosts</h1>
          {hosts.map((h) => (
            <div key={h.id} className="border p-3 rounded my-2">
              <p>{h.name}</p>
              <p>{h.email}</p>
            </div>
          ))}
        </main>
      </div>
    </ProtectedRoute>
  );
}
