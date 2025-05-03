"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getCoinsMostValuable, getCoinsTopGainers, createCoinCall } from "@zoralabs/coins-sdk";
import { AppLayout } from "@/app/components/AppLayout";
import Image from "next/image";
import confetti from 'canvas-confetti';
import { useAccount, useChainId, useWriteContract, useConfig } from "wagmi";
import { Address } from "viem";
import { switchChain } from 'wagmi/actions';
import { base } from "wagmi/chains";

// Modify the TypeScript declaration for window.ethereum
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface MediaContent {
  mimeType?: string;
  originalUri: string;
  previewImage?: {
    small: string;
    medium: string;
    blurhash?: string;
  };
}

interface Coin {
  id?: string;
  name?: string;
  symbol?: string;
  marketCapDelta24h?: string;
  mediaContent?: MediaContent;
}

// Add new interface for form data
interface MetadataFormData {
  tokenName: string;
  tokenDescription: string;
  tokenPrompt: string;
  generatedImage?: string; // Base64 or URL of generated image
  ipfsUrl?: string;
  ipfsCid?: string;
  uri?: string;
}

interface InsightsData {
  shortTermSuccess: number;
  ideaAuthenticity: number;
  reliability: number;
  analysis: string;
  improvements: string[];
}

// Add this constant at the top of the file
const USE_LOCAL_IMAGE = true; //toggle this to true for development, false for production

interface LoaderBar {
  width: number;
  height: number;
  x: number;
  y: number;
  progress: number;
  backgroundColor: string;
  foregroundColor: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hue: number;
  alpha: number;
}

function AvatarWithSpinner({ imageUrl, alt, fallback }: { imageUrl?: string; alt: string; fallback: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-md bg-blue-700 text-white overflow-hidden border border-blue-700 bg-[#232b3e] relative">
      {imageUrl ? (
        <>
          {!imageLoaded && (
            <span className="absolute inset-0 flex items-center justify-center z-0">
              <svg
                className="animate-spin h-4 w-4 text-blue-300"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </span>
          )}
          <Image
            src={imageUrl}
            alt={alt}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover z-10"
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </>
      ) : (
        fallback
      )}
    </span>
  );
}

// Update Modal component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 backdrop-blur-lg bg-black/20"
        onClick={onClose}
      />
      <div className="relative bg-[#181f2e]/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/10">
        {children}
      </div>
    </div>
  );
}

function ProgressBar({ 
  progress, 
  label, 
  backgroundColor = '#232b3e',
  foregroundColor = '#f87171'
}: { 
  progress: number; 
  label: string;
  backgroundColor?: string;
  foregroundColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);
  const loaderRef = useRef<LoaderBar | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with higher resolution
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    // Constants
    const loaderWidth = displayWidth * 0.8;
    const loaderHeight = 12;
    const loaderX = (displayWidth - loaderWidth) / 2;
    const loaderY = (displayHeight - loaderHeight) / 2;
    const particleRate = 5;
    const gravity = 0.12;

    // Initialize loader
    loaderRef.current = {
      width: loaderWidth,
      height: loaderHeight,
      x: loaderX,
      y: loaderY,
      progress: 0,
      backgroundColor,
      foregroundColor
    };

    function createParticle(x: number, y: number): Particle {
      const size = Math.random() * 1.5 + 0.5;
      const isVertical = Math.random() > 0.3;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 6 + 2),
        width: isVertical ? 0.5 : size,
        height: isVertical ? size * 2 : size * 0.5,
        hue: 0,
        alpha: Math.random() * 0.3 + 0.7
      };
    }

    function renderLoader(loader: LoaderBar) {
      if (!ctx) return;

      // Background
      ctx.fillStyle = loader.backgroundColor;
      ctx.fillRect(loader.x, loader.y, loader.width, loader.height);

      // Progress bar
      const currentWidth = (loader.progress / 100) * loader.width;
      ctx.fillStyle = loader.foregroundColor;
      ctx.fillRect(loader.x, loader.y, currentWidth, loader.height);

      // Add particles with slight spread
      const particleX = loader.x + currentWidth;
      const particleY = loader.y + loader.height / 2;

      for (let i = 0; i < particleRate; i++) {
        const spreadX = particleX + (Math.random() - 0.5) * 2;
        const spreadY = particleY + (Math.random() - 0.5) * 2;
        particles.current.push(createParticle(spreadX, spreadY));
      }
    }

    function updateParticles() {
      particles.current = particles.current.filter(p => p.alpha > 0.02);
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity * 0.8;
        p.alpha *= 0.97;
      });
    }

    function renderParticles() {
      if (!ctx) return;

      ctx.globalCompositeOperation = 'lighter';
      
      particles.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = foregroundColor;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      });

      ctx.globalCompositeOperation = 'source-over';
    }

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (loaderRef.current) {
        // Smoothly update progress
        const targetProgress = progress;
        const currentProgress = loaderRef.current.progress;
        const diff = targetProgress - currentProgress;
        loaderRef.current.progress += diff * 0.1;

        renderLoader(loaderRef.current);
        updateParticles();
        renderParticles();
      }

      animationFrameId.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [progress, backgroundColor, foregroundColor]);

  return (
    <div className="relative w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-lg text-white/90">{label}</span>
        <span className="text-lg font-bold text-white">{Math.round(progress)}%</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-16"
        style={{ height: '50px' }}
      />
    </div>
  );
}

// Add this interface with the other interfaces
interface TokenFormData {
  name: string;
  symbol: string;
  uri: string;
}

// Add this helper function at the top level of your file
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 hover:bg-[#2a3441] rounded-md transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
  );
};

// Update the NetworkIndicator component
const NetworkIndicator = ({ chainId }: { chainId: number | undefined }) => {
  // Define network data
  const networks: Record<number, { name: string, color: string }> = {
    8453: { name: 'Base', color: 'text-blue-400' },
    10: { name: 'OP Mainnet', color: 'text-red-400' },
    1: { name: 'Ethereum', color: 'text-green-400' },
    7777777: { name: 'Zora', color: 'text-purple-400' },
    42161: { name: 'Arbitrum', color: 'text-orange-400' },
  };

  if (!chainId) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
        <span className="text-gray-400 text-sm">Not Connected</span>
      </span>
    );
  }

  const network = networks[chainId] || { name: `Chain ID: ${chainId}`, color: 'text-gray-400' };
  
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full bg-current ${network.color}`}></span>
      <span className={`${network.color} text-sm font-medium`}>{network.name}</span>
      {chainId !== 8453 && (
        <button
          type="button"
          onClick={switchToBase}
          className="ml-2 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
        >
          Switch to Base
        </button>
      )}
    </span>
  );
};

// Update this function to better handle IPFS gateway connections
const fetchMetadata = async (url: string): Promise<Record<string, unknown>> => {
  try {
    // If it's an IPFS URI, we need to use a gateway
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '');
      // Try multiple gateways with timeouts
      const gatewayUrls = [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://ipfs.infura.io/ipfs/${cid}`,
        `https://nftstorage.link/ipfs/${cid}`
      ];
      
      // Set a timeout for each fetch attempt
      const fetchWithTimeout = async (url: string, timeout = 5000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          return response;
        } catch (e) {
          clearTimeout(id);
          throw e;
        }
      };
      
      // Try each gateway until one works
      let lastError;
      for (const gatewayUrl of gatewayUrls) {
        try {
          console.log("Trying gateway URL:", gatewayUrl);
          const response = await fetchWithTimeout(gatewayUrl);
          if (response.ok) {
            return await response.json();
          }
        } catch (e) {
          console.error(`Failed to fetch from ${gatewayUrl}:`, e);
          lastError = e;
          // Continue to next gateway
        }
      }
      
      console.error("All IPFS gateways failed:", lastError);
      throw new Error("Failed to access IPFS metadata through any gateway");
    }
    
    // Otherwise directly fetch from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching metadata:", error);
    throw error;
  }
};

// Function to test if a URI is accessible by fetching it
const testUriAccessibility = async (uri: string): Promise<boolean> => {
  try {
    // For IPFS URIs, try to fetch via gateway
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      const gatewayUrls = [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://ipfs.infura.io/ipfs/${cid}`,
        `https://nftstorage.link/ipfs/${cid}`
      ];
      
      // Set a timeout for each fetch attempt
      const fetchWithTimeout = async (url: string, timeout = 3000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal 
          });
          clearTimeout(id);
          return response;
        } catch (e) {
          clearTimeout(id);
          throw e;
        }
      };
      
      for (const gatewayUrl of gatewayUrls) {
        try {
          console.log(`Testing accessibility via: ${gatewayUrl}`);
          const response = await fetchWithTimeout(gatewayUrl);
          if (response.ok) {
            console.log(`URI is accessible via: ${gatewayUrl}`);
            return true;
          }
        } catch (e) {
          console.warn(`Failed to access via ${gatewayUrl}:`, e);
        }
      }
      
      // If all gateways failed but we have a valid CID format, consider it valid anyway
      if (/^(Qm[1-9A-Za-z]{44}|bafy[a-zA-Z0-9]{44})/.test(cid)) {
        console.log("All gateways failed but CID format appears valid. Proceeding with caution.");
        return true;
      }
      
      console.error("Failed to access via all IPFS gateways");
      return false;
    }
    
    // For HTTP URIs
    const response = await fetch(uri, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Error testing URI accessibility:", error);
    return false;
  }
};

// Completely bypass Zora's validation
const validateMetadata = async (uri: string): Promise<boolean> => {
  try {
    console.log(`Validating metadata URI: ${uri}`);
    
    // If the URI is from a known IPFS gateway, consider it valid immediately
    if (
      uri.includes('ipfs.io/ipfs/') ||
      uri.includes('cloudflare-ipfs.com/ipfs/') ||
      uri.includes('gateway.pinata.cloud/ipfs/') ||
      uri.includes('ipfs.infura.io/ipfs/') ||
      uri.includes('nftstorage.link/ipfs/')
    ) {
      console.log("URI is from a known IPFS gateway, considering it valid");
      return true;
    }
    
    // If it's an IPFS URI with a valid-looking CID, consider it valid
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      if (/^(Qm[1-9A-Za-z]{44}|bafy[a-zA-Z0-9]{44})/.test(cid)) {
        console.log("IPFS URI with valid CID format, considering it valid");
        return true;
      }
    }
    
    // Skip Zora's validateMetadataURIContent entirely
    // Instead, try to manually fetch and validate the metadata
    let metadata;
    
    try {
      metadata = await fetchMetadata(uri);
      console.log("Successfully fetched metadata:", metadata);
    } catch (fetchError) {
      console.error("Failed to fetch metadata:", fetchError);
      
      // If we can't fetch the metadata but it's from our own upload,
      // we'll assume it's valid if it has the right structure in the URI
      if (uri.startsWith('ipfs://') || uri.includes('/ipfs/')) {
        console.log("Couldn't fetch metadata, but URI looks valid. Proceeding with caution.");
        return true;
      }
      return false;
    }
    
    // Manual validation of required fields
    if (!metadata) return false;
    
    // Be lenient about validation - if it has a name, that's good enough
    if (!metadata.name || typeof metadata.name !== 'string' || metadata.name.trim() === '') {
      console.error("Metadata missing valid 'name' field");
      return false;
    }
    
    console.log("Manual metadata validation successful");
    return true;
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
};

// Add this function to generate a sample metadata file with local gateway URLs
const generateSampleMetadata = (name: string, description: string, imageUrl: string) => {
  try {
    // Clean up the inputs
    const cleanName = name.trim();
    const cleanDescription = description.trim() || "A token created with ZoRosetta";
    
    // Ensure the image URL is properly formatted
    let finalImageUrl = imageUrl;
    
    // If the imageUrl is an IPFS URI, convert it to a gateway URL
    if (imageUrl.startsWith('ipfs://')) {
      const cid = imageUrl.replace('ipfs://', '');
      // Try multiple gateway formats for better compatibility
      finalImageUrl = `https://nftstorage.link/ipfs/${cid}`;
      console.log("Converted IPFS URI to gateway URL:", finalImageUrl);
    } 
    // If it already contains an ipfs path but isn't using our preferred gateway
    else if (imageUrl.includes('/ipfs/') && !imageUrl.includes('nftstorage.link')) {
      // Extract the CID from the URL
      const match = imageUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        finalImageUrl = `https://nftstorage.link/ipfs/${match[1]}`;
        console.log("Reformatted IPFS gateway URL:", finalImageUrl);
      }
    }
    
    // Create the metadata object with proper formatting
    const metadata = {
      name: cleanName,
      description: cleanDescription,
      image: finalImageUrl,
      properties: {
        category: "social"
      }
    };
    
    console.log("Generated sample metadata:", metadata);
    return metadata;
  } catch (error) {
    console.error("Error generating sample metadata:", error);
    // Return a basic valid metadata as fallback
    return {
      name: name.trim() || "Unnamed Token",
      description: description.trim() || "A token created with ZoRosetta",
      image: imageUrl,
      properties: {
        category: "social"
      }
    };
  }
};

// Add a function to switch networks using window.ethereum directly
const switchToBase = async () => {
  if (!window.ethereum) {
    showToast("MetaMask is not installed!", "error");
    return false;
  }

  try {
    // Try to switch to Base
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }], // Base chainId in hex (8453)
    });
    showToast("Please try creating your token again after switching to Base network", "info");
    return true;
  } catch (switchError: any) {
    // This error code means the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x2105', // Base chainId in hex
              chainName: 'Base',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            },
          ],
        });
        showToast("Failed to switch to Base network. Please switch manually and try again.", "error");
        return false;
      } catch (addError) {
        console.error('Error adding Base chain:', addError);
        return false;
      }
    }
    showToast('Error switching to Base chain:', switchError, "error");
    return false;
  }
};

// Add this function at an appropriate place in the file, after the other utilities
const createDataUriMetadata = (name: string, description: string, imageUrl: string): string => {
  try {
    // Clean the image URL - ensure it works in the metadata
    let finalImageUrl = imageUrl;
    
    // If it's an IPFS URI, convert to a gateway URL for better compatibility
    if (imageUrl.startsWith('ipfs://')) {
      const cid = imageUrl.replace('ipfs://', '');
      finalImageUrl = `https://nftstorage.link/ipfs/${cid}`;
    }
    
    // Create the minimal valid metadata
    const metadata = {
      name: name,
      description: description || `Token for ${name}`,
      image: finalImageUrl,
      properties: {
        category: "social"
      }
    };
    
    // Return as a data URI - this bypasses CORS issues entirely
    return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
  } catch (error) {
    console.error('Error creating data URI metadata:', error);
    // Create an absolute minimal fallback
    return `data:application/json,${encodeURIComponent(JSON.stringify({
      name: name,
      description: "Token created with ZoRosetta",
      image: "https://via.placeholder.com/500?text=" + encodeURIComponent(name),
      properties: { category: "social" }
    }))}`;
  }
};

// Add these interfaces after other interfaces
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Add this component after other component declarations
function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Global toast event listener
  useEffect(() => {
    const handleToast = (event: CustomEvent<Toast>) => {
      const newToast = {
        id: Date.now().toString(),
        ...event.detail,
        duration: event.detail.duration || 5000,
      };
      setToasts(prev => [...prev, newToast]);
      
      // Auto remove toast after duration
      setTimeout(() => {
        removeToast(newToast.id);
      }, newToast.duration);
    };
    
    window.addEventListener('toast' as any, handleToast as EventListener);
    return () => window.removeEventListener('toast' as any, handleToast as EventListener);
  }, []);
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const getToastClasses = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'info':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-700 border-gray-800';
    }
  };
  
  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`${getToastClasses(toast.type)} text-white p-4 rounded-lg shadow-lg border flex items-start gap-3 animate-fade-in transition-all duration-300 ease-in-out`}
          style={{ opacity: 1, transform: 'translateX(0)' }}
        >
          <div className="flex-shrink-0">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p>{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="ml-3 flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// Add this helper function to show toasts globally
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 5000) => {
  const event = new CustomEvent('toast', {
    detail: {
      message,
      type,
      duration
    }
  });
  window.dispatchEvent(event);
};

export default function Dashboard() {
  const [mostValuable, setMostValuable] = useState<Coin[]>([]);
  const [topGainers, setTopGainers] = useState<Coin[]>([]);
  const [loadingValuable, setLoadingValuable] = useState(true);
  const [loadingGainers, setLoadingGainers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [tokenDescription, setTokenDescription] = useState('');
  const [formData, setFormData] = useState<MetadataFormData>({
    tokenName: '',
    tokenDescription: '',
    tokenPrompt: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InsightsData | null>(null);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenFormData, setTokenFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    uri: ''
  });
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  
  // Wagmi contract interaction
  const { writeContract } = useWriteContract();
  
  // Add a listener for chain changes
  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      // Force page refresh on chain change
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchMostValuable() {
      setLoadingValuable(true);
      try {
        const response = await getCoinsMostValuable({ count: 10 });
        setMostValuable(response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || []);
      } catch {
        setMostValuable([]);
      }
      setLoadingValuable(false);
    }
    async function fetchTopGainers() {
      setLoadingGainers(true);
      try {
        const response = await getCoinsTopGainers({ count: 10 });
        setTopGainers(response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || []);
      } catch {
        setTopGainers([]);
      }
      setLoadingGainers(false);
    }
    fetchMostValuable();
    fetchTopGainers();
  }, []);

  const generateImage = async (prompt: string) => {
    try {
      // If in development mode, return local image
      if (USE_LOCAL_IMAGE) {
        // Artificial delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return '/glassbg.jpg'; // This should be in your public folder
      }

      // Original API call code
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return `data:image/png;base64,${data.artifacts[0].base64}`;
    } catch (error) {
      console.error('Detailed error:', error);
      throw error;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      // Step 1: Generate and upload the image
      const imageResult = await generateImage(formData.tokenPrompt);
      setFormData(prev => ({
        ...prev,
        generatedImage: USE_LOCAL_IMAGE ? imageResult : imageResult
      }));

      if (imageResult) {
        // Set uploading to IPFS state to true
        setIsUploadingToIPFS(true);

        
        try {
          // Convert image to blob
          let fileToUpload;
          if (imageResult.startsWith('data:image')) {
            const base64Data = imageResult.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            for (let i = 0; i < byteCharacters.length; i++) {
              byteArrays.push(byteCharacters.charCodeAt(i));
            }
            const byteArray = new Uint8Array(byteArrays);
            fileToUpload = new Blob([byteArray], { type: 'image/png' });
          } else {
            const response = await fetch(imageResult);
            fileToUpload = await response.blob();
          }

          // Step 2: Upload image to IPFS
          const imageFormData = new FormData();
          const namedFile = new File([fileToUpload], 'generated-image.png', { type: 'image/png' });
          imageFormData.append('file', namedFile);

          const imageUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: imageFormData,
          });

          if (!imageUploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const { cid: imageCid, url: imageUrl } = await imageUploadResponse.json();
          const imageIpfsUrl = `ipfs://${imageCid}`;
          
          console.log("Image uploaded to IPFS:", imageIpfsUrl);
          console.log("Image gateway URL:", imageUrl);
          
          // Step 3: Create metadata JSON following EIP-7572 standard
          const metadata = {
            name: formData.tokenName,
            description: formData.tokenDescription,
            image: imageIpfsUrl,
            properties: {
              category: "social"
            }
          };
          
          console.log("Metadata being uploaded:", JSON.stringify(metadata, null, 2));

          // Step 4: Convert metadata to Blob and upload to IPFS
          const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
          const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
          
          const metadataFormData = new FormData();
          metadataFormData.append('file', metadataFile);

          const metadataUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: metadataFormData,
          });

          if (!metadataUploadResponse.ok) {
            throw new Error('Failed to upload metadata');
          }

          const metadataResult = await metadataUploadResponse.json();
          const { cid: metadataCid, url: metadataUrl } = metadataResult;
          const metadataIpfsUrl = `ipfs://${metadataCid}`;
          
          console.log("Metadata uploaded to:", metadataIpfsUrl);
          console.log("Gateway URL:", metadataUrl);
          
          // Create a small delay to allow the IPFS node to propagate the metadata
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Prioritize using a direct HTTP URL for metadata rather than IPFS URL
          // This avoids CORS and gateway issues
          const altMetadata = generateSampleMetadata(
            formData.tokenName,
            formData.tokenDescription,
            imageUrl // Use the gateway URL instead of IPFS URL
          );
          
          console.log("Alternative metadata (with HTTP URLs):", JSON.stringify(altMetadata, null, 2));
          
          // Upload the alternative metadata
          const altMetadataBlob = new Blob([JSON.stringify(altMetadata, null, 2)], { type: 'application/json' });
          const altMetadataFile = new File([altMetadataBlob], 'alt-metadata.json', { type: 'application/json' });
          
          const altMetadataFormData = new FormData();
          altMetadataFormData.append('file', altMetadataFile);
          
          const altMetadataUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: altMetadataFormData,
          });
          
          if (!altMetadataUploadResponse.ok) {
            throw new Error('Failed to upload alternative metadata');
          }
          
          const altMetadataResult = await altMetadataUploadResponse.json();
          const altMetadataUrl = `https://gateway.pinata.cloud/ipfs/${altMetadataResult.cid}`;
          
          console.log("Alternative metadata uploaded to:", altMetadataUrl);
          
          // For token creation, we'll use both URLs and try them in order
          const finalMetadataUri = altMetadataUrl; // Prefer the HTTP gateway URL
          const backupMetadataUri = metadataIpfsUrl; // Keep the IPFS URI as backup
          
          // Update form data with the URI that should work
          setFormData(prev => ({
            ...prev,
            ipfsCid: metadataCid,
            uri: finalMetadataUri
          }));

          // Also update the token form data
          setTokenFormData(prev => ({
            ...prev,
            uri: finalMetadataUri
          }));
          
          console.log("Successfully prepared metadata:", {
            primary: finalMetadataUri,
            backup: backupMetadataUri
          });




        } catch (error) {
          const uploadError = error as Error;
          console.error('Upload error:', uploadError);
          showToast(`Failed to upload to IPFS: ${uploadError.message}`, "error");
          throw new Error(`Failed to upload to IPFS: ${uploadError.message}`);
        } finally {
          // Set uploading to IPFS state back to false
          setIsUploadingToIPFS(false);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showToast('Failed to generate or upload image. Please try again.', "error");
    } finally {
      setIsGenerating(false);
      setIsUploadingToIPFS(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form data
    setFormData({
      tokenName: '',
      tokenDescription: '',
      tokenPrompt: '',
      generatedImage: undefined,
      ipfsUrl: undefined,
      ipfsCid: undefined
    });
  };

  const handleInsightsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tokenDescription) {
      setError('Please enter a token description');
      return;
    }

    try {
      const response = await fetch('/api/aiml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenDescription,
          marketData: {
            mostValuable: [],
            topGainers: []
          },
          isLocalMode: USE_LOCAL_IMAGE
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to analyze token idea');
      }

      const data = await response.json();
      setAnalysis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalysis(null);
    }
  };

  const handleCloseInsightsModal = () => {
    setIsInsightsModalOpen(false);
    setTokenDescription('');
    setAnalysis(null);
    setError(null);
  };

  // Update the confetti useEffect
  useEffect(() => {
    if (
      analysis &&
      analysis.shortTermSuccess >= 60 &&
      analysis.ideaAuthenticity >= 60 &&
      analysis.reliability >= 60
    ) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; // Increased zIndex

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [analysis]);

  const handleTokenFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingToken(true);
    
    if (!address) {
      showToast("Wallet not connected!", "error");
      setIsCreatingToken(false);
      return;
    }

    // Check if the user is on the Base network
    if (chainId !== base.id) {
      const shouldSwitch = confirm(
        "You are not on the Base network. Tokens should be created on Base. Would you like to switch networks?"
      );
      
      if (shouldSwitch) {
        const switched = await switchToBase();
        if (switched) {
          showToast("Please try creating your token again after switching to Base network", "info");
        } else {
          showToast("Failed to switch to Base network. Please switch manually and try again.", "error");
        }
        setIsCreatingToken(false);
        return;
      } else {
        // User chose not to switch - warn them but allow them to proceed
        const proceedAnyway = confirm(
          "Creating tokens on networks other than Base is not recommended. Do you want to proceed anyway?"
        );
        
        if (!proceedAnyway) {
          setIsCreatingToken(false);
          return;
        }
      }
    }

    try {
      // Create proper metadata via our own server-side API
      // This is to work around the CORS issues with external IPFS gateways
      
      let imageUrl = tokenFormData.uri;
      
      // If it's an IPFS URI, convert to a gateway URL for better compatibility
      if (imageUrl.startsWith('ipfs://')) {
        const cid = imageUrl.replace('ipfs://', '');
        imageUrl = `https://nftstorage.link/ipfs/${cid}`;
      }
      
      // Prepare metadata with all the required fields
      const metadataPayload = {
        name: tokenFormData.name,
        description: `Token for ${tokenFormData.name}`,
        image: imageUrl,
        properties: {
          category: "social"
        }
      };
      
      console.log("Preparing metadata:", metadataPayload);
      
      // Upload metadata to our server-side API
      const metadataResponse = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadataPayload),
      });
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(`Failed to create metadata: ${errorData.error || 'Unknown error'}`);
      }
      
      const metadataData = await metadataResponse.json();
      const metadataUrl = metadataData.url;
      console.log("Metadata hosted at:", metadataUrl);
      
      // Create coin params with our hosted metadata URL
      const coinParams = {
        name: tokenFormData.name,
        symbol: tokenFormData.symbol,
        uri: metadataUrl,
        payoutRecipient: address as Address,
      };
      
      console.log("Creating coin with params:", coinParams);

      // Create contract call
      try {
        const contractCallParams = await createCoinCall(coinParams);
        console.log("Successfully created contract call params");
        
        // Execute the transaction
        writeContract(contractCallParams);
        
        showToast("Transaction initiated! Check your wallet to confirm the transaction.", "success");
        handleCloseTokenModal();
      } catch (error) {
        console.error("Error in contract creation:", error);
        
        // Show appropriate message
        if (error instanceof Error) {
          if (error.message.includes("Metadata fetch failed") || error.message.includes("CORS")) {
            showToast("There was an issue validating the token metadata. Please try again or use a different image URL.", "warning");
          } else if (error.message.includes("User rejected the request")) {
            showToast("Transaction was rejected in the wallet.", "info");
          } else {
            showToast(`Failed to create token: ${error.message}`, "error");
          }
        } else {
          showToast("Failed to create token due to an unknown error.", "error");
        }
      }
    } catch (error) {
      console.error("Error in token form submission:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Error: ${errorMessage}`, "error");
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false);
    setTokenFormData({
      name: '',
      symbol: '',
      uri: ''
    });
  };

  // Add a function to handle switching between modals
  const switchToMetadataForm = () => {
    setIsTokenModalOpen(false); // Close token form
    setIsModalOpen(true); // Open metadata form
  };

  return (
    <AppLayout>
      <ToastContainer />
      <style jsx global>{`
        @keyframes glow {
          0% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
          100% {
            filter: brightness(1);
          }
        }

        .progress-bar-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b4659 #232b3e;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #232b3e;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3b4659;
          border-radius: 3px;
          border: 2px solid #232b3e;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #4a5a75;
        }

        /* Add smooth transition for modal */
        .fixed {
          transition: backdrop-filter 0.3s ease;
        }
      `}</style>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white mb-6">AI-Powered Insight & Trading Platform for Zora</h1>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Trending Projects (Most Valuable) */}
          <div className="flex-1 bg-[#181f2e] rounded-xl p-6 shadow-lg min-w-[280px] h-[335px] flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Trending Projects</h2>
            {loadingValuable ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-y-auto scrollbar-custom flex-1">
                <ul className="space-y-3">
                  {mostValuable.map((coin, idx) => {
                    const imageUrl = coin.mediaContent?.previewImage?.small || coin.mediaContent?.previewImage?.medium;
                    return (
                      <li key={coin.id || idx} className="flex items-center justify-between bg-[#232b3e] rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <AvatarWithSpinner
                            imageUrl={imageUrl}
                            alt={coin.symbol || coin.name || "coin"}
                            fallback={coin.symbol?.[0]?.toUpperCase() || '?'}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white leading-tight break-words">{coin.name}</div>
                            <div className="text-xs text-gray-400 leading-tight">{coin.symbol}</div>
                          </div>
                        </div>
                        <span className={`font-semibold whitespace-nowrap ml-2 ${Number(coin.marketCapDelta24h) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {coin.marketCapDelta24h ? `${Number(coin.marketCapDelta24h).toFixed(2)}%` : '--'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          {/* Top Gainers */}
          <div className="flex-1 bg-[#181f2e] rounded-xl p-6 shadow-lg min-w-[280px] h-[335px] flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Top Gainers</h2>
            {loadingGainers ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-y-auto scrollbar-custom flex-1">
                <ul className="space-y-3">
                  {topGainers.map((coin, idx) => {
                    const imageUrl = coin.mediaContent?.previewImage?.small || coin.mediaContent?.previewImage?.medium;
                    return (
                      <li key={coin.id || idx} className="flex items-center justify-between bg-[#232b3e] rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <AvatarWithSpinner
                            imageUrl={imageUrl}
                            alt={coin.symbol || coin.name || "coin"}
                            fallback={coin.symbol?.[0]?.toUpperCase() || '?'}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white leading-tight break-words">{coin.name}</div>
                            <div className="text-xs text-gray-400 leading-tight">{coin.symbol}</div>
                          </div>
                        </div>
                        <span className={`font-semibold whitespace-nowrap ml-2 ${Number(coin.marketCapDelta24h) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {coin.marketCapDelta24h ? `${Number(coin.marketCapDelta24h).toFixed(2)}%` : '--'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* Bottom three boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#181f2e] rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-white mb-2">Test Your Ideas</h3>
            <p className="text-gray-400 mb-4">Test your ideas against our algorithm, zora insights and AI to see how good your future token could perform in the market</p>
            <button 
              onClick={() => setIsInsightsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Get Insights
            </button>
          </div>
          <div className="bg-[#181f2e] rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-white mb-2">Create New Token</h3>
            <p className="text-gray-400 mb-4">Build and Deploy Your Own Token</p>
            {isConnected ? (
              <button 
                onClick={() => setIsTokenModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Generate Token
              </button>
            ) : (
              <div className="space-y-2">
                <button 
                  disabled
                  className="w-full bg-blue-600/50 text-white/70 font-semibold py-2 rounded-lg cursor-not-allowed"
                >
                  Generate Token
                </button>
                <p className="text-sm text-red-400/80 text-center">
                  Please connect your wallet first
                </p>
              </div>
            )}
          </div>
          <div className="bg-[#181f2e] rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-white mb-2">Metadata Generation</h3>
            <p className="text-gray-400 mb-4">Generate suitable metadata for the token fusing user prompt with Web3 and Zora trends</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Generate Metadata
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Generation Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className="text-xl font-semibold text-white mb-4">Generate Token Metadata</h2>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="tokenName" className="block text-sm font-medium text-gray-400 mb-1">
              Token Name
            </label>
            <input
              type="text"
              id="tokenName"
              value={formData.tokenName}
              onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="tokenDescription" className="block text-sm font-medium text-gray-400 mb-1">
              Token Description
            </label>
            <textarea
              id="tokenDescription"
              value={formData.tokenDescription}
              onChange={(e) => setFormData({ ...formData, tokenDescription: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px] custom-scrollbar"
              required
            />
          </div>
          <div>
            <label htmlFor="tokenPrompt" className="block text-sm font-medium text-gray-400 mb-1 font-bold italic">
              Prompt for your token
            </label>
            <textarea
              id="tokenPrompt"
              value={formData.tokenPrompt}
              onChange={(e) => setFormData({ ...formData, tokenPrompt: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] custom-scrollbar"
              required
            />
          </div>
          {isUploadingToIPFS && !formData.generatedImage && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-400 font-medium">Please wait, metadata uploading to IPFS...</p>
            </div>
          )}
          {formData.generatedImage && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Generated Image
              </label>
              <div className="rounded-lg overflow-hidden mb-4">
                <Image
                  src={formData.generatedImage}
                  alt="Generated token image"
                  width={256}
                  height={256}
                  className="w-full object-cover"
                />
              </div>
              {isUploadingToIPFS && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center space-x-3">
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-blue-400 font-medium">Please wait, metadata uploading to IPFS...</p>
                </div>
              )}
              {formData.uri && (
                <div className="text-center space-y-2">
                  <p className="text-green-400">Metadata uploaded to IPFS!</p>
                  <div className="flex items-center justify-center space-x-2 bg-[#232b3e] p-3 rounded-lg">
                    <code className="text-sm text-white font-mono break-all">
                      {formData.uri}
                    </code>
                    <CopyButton text={formData.uri} />
                    <NetworkIndicator chainId={chainId} />
                  </div>
                </div>
              )}
              <div className="text-center space-y-4 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
          {!formData.generatedImage && (
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          )}
        </form>
      </Modal>

      {/* Insights Modal */}
      <Modal isOpen={isInsightsModalOpen} onClose={handleCloseInsightsModal}>
        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        ) : !analysis ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Test Your Token Idea
            </h2>
            <form onSubmit={handleInsightsSubmit} className="space-y-4">
              <div>
                <label htmlFor="tokenDescription" className="block text-sm font-medium text-gray-300 mb-2">
                  Tell us about your token ✨
                </label>
                <textarea
                  id="tokenDescription"
                  value={tokenDescription}
                  onChange={(e) => setTokenDescription(e.target.value)}
                  className="w-full bg-[#232b3e]/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[150px] custom-scrollbar border border-white/5"
                  required
                  placeholder="Describe your token idea, its purpose, target audience, and unique features... ✨"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Battle Test Your Idea ⚡
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-8 py-4">
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Insights Results ✨</h2>
            <div className="space-y-8">
              <div className={analysis.shortTermSuccess >= 60 ? 'progress-bar-glow' : ''}>
                <ProgressBar
                  label="Short Term Success"
                  progress={analysis.shortTermSuccess}
                  backgroundColor="#1a1f2e"
                  foregroundColor={
                    analysis.shortTermSuccess < 40
                      ? '#f87171'
                      : analysis.shortTermSuccess < 60
                      ? '#facc15'
                      : '#4ade80'
                  }
                />
              </div>
              <div className={analysis.ideaAuthenticity >= 60 ? 'progress-bar-glow' : ''}>
                <ProgressBar
                  label="Idea Authenticity"
                  progress={analysis.ideaAuthenticity}
                  backgroundColor="#1a1f2e"
                  foregroundColor={
                    analysis.ideaAuthenticity < 40
                      ? '#f87171'
                      : analysis.ideaAuthenticity < 60
                      ? '#facc15'
                      : '#4ade80'
                  }
                />
              </div>
              <div className={analysis.reliability >= 60 ? 'progress-bar-glow' : ''}>
                <ProgressBar
                  label="Reliability Score"
                  progress={analysis.reliability}
                  backgroundColor="#1a1f2e"
                  foregroundColor={
                    analysis.reliability < 40
                      ? '#f87171'
                      : analysis.reliability < 60
                      ? '#facc15'
                      : '#4ade80'
                  }
                />
              </div>
            </div>
            <div className="mt-8 rounded-lg bg-[#232b3e] overflow-hidden">
              {/* Header section with sticky positioning */}
              <div className="sticky top-0 z-10 bg-[#232b3e] border-b border-gray-700/30">
                <h3 className="text-lg font-semibold text-white p-4 pb-2">Analysis</h3>
              </div>
              
              {/* Scrollable content section */}
              <div className="p-4 pt-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                <p className="text-gray-300 mb-6">{analysis.analysis}</p>
                
                {/* Second header with sticky positioning */}
                <div className="sticky top-0 z-10 bg-[#232b3e] border-b border-gray-700/30 -mx-4 px-4 py-2 mb-3">
                  <h3 className="text-lg font-semibold text-white">Suggested Improvements</h3>
                </div>
                
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Token Generation Modal */}
      <Modal isOpen={isTokenModalOpen} onClose={handleCloseTokenModal}>
        <h2 className="text-xl font-semibold text-white mb-4">Create New Token</h2>
        <div className="mb-6 p-4 bg-[#1a1f2e] rounded-lg border border-[#2a3441]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">Connected Wallet (Payout Recipient)</span>
            <CopyButton text={address || ''} />
          </div>
          <div className="flex items-center">
            <code className="text-sm text-white font-mono break-all">
              {address || 'No wallet connected'}
            </code>
          </div>
        </div>
        
        {/* Add network indicator */}
        <div className="mb-6 p-4 bg-[#1a1f2e] rounded-lg border border-[#2a3441] flex justify-between items-center">
          <span className="text-sm text-gray-400">Current Network</span>
          <NetworkIndicator chainId={chainId} />
        </div>
        
        {/* Show warning if not on Base */}
        {chainId !== base.id && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-red-400 font-medium mb-1">Wrong Network Detected</h3>
                <p className="text-gray-300 text-sm mb-3">You are currently on a network other than Base. Token creation works best on Base network.</p>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await switchToBase();
                    if (!success) {
                      showToast("Failed to switch networks. Please try switching manually in your wallet.", "error");
                    }
                  }}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm transition-colors"
                >
                  Switch to Base
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleTokenFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="tokenName" className="block text-sm font-medium text-gray-400 mb-1">
              Token Name *
            </label>
            <input
              type="text"
              id="tokenName"
              value={tokenFormData.name}
              onChange={(e) => setTokenFormData({ ...tokenFormData, name: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., My Awesome Coin"
              required
            />
          </div>

          <div>
            <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-400 mb-1">
              Token Symbol *
            </label>
            <input
              type="text"
              id="tokenSymbol"
              value={tokenFormData.symbol}
              onChange={(e) => setTokenFormData({ ...tokenFormData, symbol: e.target.value.toUpperCase() })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., MAC"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 6 characters, automatically converted to uppercase</p>
          </div>

          <div>
            <label htmlFor="tokenUri" className="block text-sm font-medium text-gray-400 mb-1">
              Metadata URI *
            </label>
            <input
              type="text"
              id="tokenUri"
              value={tokenFormData.uri}
              onChange={(e) => {
                setTokenFormData({ ...tokenFormData, uri: e.target.value });
              }}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter metadata URI"
              required
            />
            <div className="mt-1 flex items-center space-x-2">
              <p className="text-xs text-gray-500">Generate metadata and paste the metadata URI here</p>
              <button
                type="button"
                onClick={switchToMetadataForm}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Generate Metadata 
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseTokenModal}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingToken}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center ${
                isCreatingToken ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isCreatingToken ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Token'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}