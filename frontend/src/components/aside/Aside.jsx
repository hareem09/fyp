import React from 'react'
import { Link } from 'react-router-dom'
function Aside() {
  return (
   <>
   
    <div className="aside w-44 md:w-62.5  flex flex-col font-sans h-screen  bg-blue-300 md:ml-0 ">
        <img src="Images\bethany-badge-logo.png" alt="" className="logo2  mt-14 ml-20 "/>
        <h5 className="heading mt-3 self-center text-bold text-sm w-48 h-6 ml-2">
            <b>Dashboard</b>
        </h5>
        <ul className=" underline text-amber-600 ml-0 md:ml-2">
            <li><Link to='/students' >Students</Link></li>
            <li><Link to='/teachers'>Teachers</Link></li>
            <li><Link to='/admin/create-invite'>Create Invite</Link></li>
        </ul>
    </div>
   </>
  )
}

export default Aside