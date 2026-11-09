import { useState } from "react"
import './App.css'
import { Route, Routes } from "react-router-dom"
import Navbar from "./components/Navbar"
import InfiniteS from "./components/InfiniteS"
import Hero from "./pages/landing/Hero"
import Category from "./pages/landing/Category"
import ProductSection from "./pages/landing/ProductSection"
import CatalogoPage from "./pages/catalogo"
import ProductoDetallePage from "./components/ProductDetail"

function HomePage({ onAddToCart, onToggleWishlist, wishlist }) {
  return (
    <>
      <InfiniteS />
      <Hero />
      <Category />
      <ProductSection
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
        wishlist={wishlist}
      />
    </>
  )
}

function App() {
  const [cartItems, setCartItems] = useState([])
  const [wishlist, setWishlist] = useState(() => new Set())

  const addToCart = (product) => {
    const quantity = Number(product.qty) > 0 ? Number(product.qty) : 1
    setCartItems((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + quantity } : item
        )
      }
      return [...items, { ...product, qty: quantity }]
    })
  }

  const toggleWishlist = (product, isWished) => {
    setWishlist((items) => {
      const next = new Set(items)
      if (isWished) next.add(product.id)
      else next.delete(product.id)
      return next
    })
  }

  const removeFromCart = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  return (
    <>
      <Navbar
        cartItems={cartItems}
        wishlistCount={wishlist.size}
        onRemoveItem={removeFromCart}
      />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="/catalogo"
          element={
            <CatalogoPage
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="/producto/:slug"
          element={
            <ProductoDetallePage
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="*"
          element={
            <HomePage
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          }
        />
      </Routes>
    </>
  )
}

export default App
