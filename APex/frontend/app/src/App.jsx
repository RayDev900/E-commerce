import './App.css'
import Navbar from "./components/Navbar"
import InfiniteS from "./components/InfiniteS"
import Hero from "../src/pages/landing/Hero"
import Category from "../src/pages/landing/category"

function App() {
  return (
    <>
      <Navbar />
      <InfiniteS />
      <Hero />
      <Category />
    </>
  )
}

export default App
