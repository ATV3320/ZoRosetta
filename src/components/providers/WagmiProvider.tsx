'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { mainnet } from 'viem/chains'
import { createConfig, WagmiProvider as WagmiConfig } from 'wagmi'
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

// Note: We'll import the styles in the layout component
// import '@rainbow-me/rainbowkit/styles.css'

const config = getDefaultConfig({
  appName: 'Zorosetta',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  },
})

// Create a client
const queryClient = new QueryClient()

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#1D4ED8',
            borderRadius: 'large',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
} 