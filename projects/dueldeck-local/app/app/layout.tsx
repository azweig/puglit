"use client";
//app/app/layout.tsx

import React from 'react';
import { useState } from 'react';

const Layout = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(response => response.json())
      .then(data => setAuthStatus(data)) 
      .catch(error => { 
        console.error('Error fetching auth data:', error);  
        setAuthStatus({ status: 'failure', message: 'Please login' }); 
        setLoading(false);
      }); 
  }, []);

  useEffect(() => {
    if (authStatus && !loading) { 
      setLoading(true); 
      // Load data here for the user or dashboard... 
    } 
  }, [authStatus]);

  return ( 
    <div className='container mx-auto flex h-screen'> 
      <header className='bg-[#7C3AED] fixed top-0 left-0 w-full p-4'> 
        <nav className='flex items-center justify-between'> 
          <Link href='/'>Home</Link> 
          <Link href='/decks' className='text-white hover:bg-[#5E302A]'>My Decks</Link> 
          <Link href='/matches' className='text-white hover:bg-[#5E302A]'>Matches</Link> </nav> 
      </header> 

      <main className='flex flex-col items-center justify-center h-screen p-4'> 
        {loading ? ( 
          <div className='text-center'> Loading...</div> 
        ) : authStatus.status === 'failure' ? ( 
          <div className='bg-[#D4D4D4] rounded-lg p-4 text-center flex items-center justify-center'> 
            <div className='bg-red-500 rounded-full p-2 w-16 h-16'></div> 
            <p className='text-white font-semibold'>Please login</p> 
          </div> 
        ) : ( 
          <section className='flex flex-col items-center justify-center h-screen'> 
            {children} 
          </section> 
        )} 
      </main>
    </div> 
  );
};

export default Layout;
