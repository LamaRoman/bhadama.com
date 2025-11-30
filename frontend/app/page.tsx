// app/page.jsx

import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import PublicListingPage from "./public/PublicListingPage.jsx"
export default function Home(){
  return (
    <div>
      <Navbar/>
      <main className="p-10">
        <PublicListingPage/>
      </main>
      <Footer/>
    </div>
  )
}