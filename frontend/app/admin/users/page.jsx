"use client";
import { useEffect,useState } from "react";
import {api} from "../../utils/api.js";
import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { useAuth } from "../../../hooks/useAuth";
import Navbar from "../../../components/Navbar.jsx";

export default function AdminUsers(){
    const {user} = useAuth();
    const [users,setUsers]=useState([]);

    const fetchUsers = async () =>{
        try{
            const data = await api("/api/admin");
            console.log("Fetched users:", data, Array.isArray(data));
            setUsers(data);
        }catch(err){
            console.error(err);
            setUsers([]);
        }
    };

    useEffect(()=>{
        fetchUsers();
    },[]);

    return(
        <ProtectedRoute user={user} role="ADMIN">
            <Navbar/>
            <main className="p-10">
                <h1 className="text-xl font-bold">All Users</h1>
            
                <table className="w-full border mt-6">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">Name</th>
                            <th className="border p-2">Email</th>
                            <th className="border p-2">Role</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((u)=>(
                            <tr key={u.id}>
                                <td className="border p-2">{u.name}</td>    
                                <td className="border p-2">{u.email}</td>
                                <td className="border p-2">{u.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </ProtectedRoute>
    )
}