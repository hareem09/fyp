import React from 'react'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import { Outlet } from 'react-router-dom'
import Aside from './components/aside/Aside'

function Layout() {
  return (
    <>
    <div className="body w-full md:w-full md:max-h-screen flex flex-col shrink">
    <Header />
    <div className="main w-full md:w-full sm:max-h-screen  flex flex-wrap  ">
    <Aside/>
    <Outlet/>
    </div>
    <Footer/>
    </div>
    </>
  )
}

export default Layout