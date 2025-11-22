// components/Navbar.jsx

"use client";
import Link from "next/link";
import {useAuth} from "../hooks/useAuth.js";

export default function Navbar(){
    const {user,logout} = useAuth();

    return(
        <nav className="bg-lama p-4 text-white flex justify-between">
            <Link href="/">Bhadama</Link>
            <div className="space-x-4">
                {!user && <Link href="/auth/login">
                    Login
                </Link>}
                {user && (
                    <>
                    <span>{user.name}</span>
                    <button onClick={logout}>Logout</button>
                    </>
                )}
            </div>
        </nav>
    )
}