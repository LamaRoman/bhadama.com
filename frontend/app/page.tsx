// app/page.jsx

import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import PublicListing from "./public/page.jsx";
export default function Home(){
  return (
    <div>
      <main className="p-10">
        <PublicListing/>
      </main>
    </div>
  )
}