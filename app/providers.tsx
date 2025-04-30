"use client";

import { createConfig, http } from "wagmi";
import { mainnet, zora, optimism, base, arbitrum } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  chains: [mainnet, zora, optimism, base, arbitrum],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http(),
    [zora.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
} 