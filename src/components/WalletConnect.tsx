'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function WalletConnect() {
  return (
    <div className="relative z-10">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted
          const connected = ready && account && chain

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
              className="flex items-center justify-end"
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Connect Wallet
                    </button>
                  )
                }

                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 bg-background-light hover:bg-background px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center gap-2 bg-background-light hover:bg-background px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      {account.displayName}
                    </button>
                  </div>
                )
              })()}
            </div>
          )
        }}
      </ConnectButton.Custom>
    </div>
  )
} 