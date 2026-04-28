import React from 'react'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import { Outlet } from 'react-router-dom'
import Aside from './components/aside/Aside'

function Layout() {
  return (
   <>
  <Header />
    <div className="flex-1 p-4">
      <Outlet />
    </div>
  <Footer />
</>
  )
}

export default Layout