'use client'

import { ethersAdapter, projectId, networks } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { IconButton } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'next-reown-appkit',
  description: 'next-reown-appkit',
  url: 'https://github.com/0xonerb/next-reown-appkit-ssr', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
export const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

function ContextProvider({ children }: { children: ReactNode }) {
  //const router = useRouter()
  function goHome() {
    //router.push("/");
  }

  return (
    <div>
      <div className='flex-row'>
        <IconButton onClick={goHome}>
          <HomeIcon />
        </IconButton>
        <appkit-button />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default ContextProvider
