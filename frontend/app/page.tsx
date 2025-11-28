// app/page.jsx

import Navbar from "../components/Navbar.jsx";
import PublicListingPage from "././public/page.jsx"
export default function Home(){
  return (
    <div>
      <Navbar/>
      <main className="p-10">
        <h1 className="tect-3xl font-bold">Welcome to Bhadama.com</h1>
        <p>Your platform for hosting and booking listings.</p>
        <PublicListingPage/>
      </main>
    </div>
  )
}