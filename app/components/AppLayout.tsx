import { Navbar } from "@/components/Navbar";
import { ConnectWallet } from "@/components/ConnectWallet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-800 flex items-center justify-end px-4">
          <ConnectWallet />
        </div>
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  );
} 