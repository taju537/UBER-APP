import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
      <div>
        <div className='bg-cover bg-center bg-[url(https://images.unsplash.com/photo-1619059558110-c45be64b73ae?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D)] h-screen pt-8 flex justify-between flex-col w-full '>
          <img className = 'w-16 ml-8' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
          <div className='bg-white pb-7  py-4 px-4'>
          <h2 className='text-[30px] font-bold'>Get Started with Uber</h2>
          <Link to='/login' className='flex items-center justify-center w-full bg-black text-white py-3 rounded-lg mt-5'>Continue</Link>
          </div>
        </div>
      </div>
  )
}

export default Home