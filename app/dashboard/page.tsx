"use client";

import { useEffect, useState, useRef } from "react";
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

// Add this function to directly fetch metadata from a URL
const fetchMetadata = async (url: string): Promise<Record<string, unknown>> => {
  try {
    // If it's an IPFS URI, we need to use a gateway
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '');
      // Try multiple gateways
      const gatewayUrls = [
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://gateway.pinata.cloud/ipfs/${cid}`
      ];
      
      // Try each gateway until one works
      for (const gatewayUrl of gatewayUrls) {
        try {
          console.log("Trying gateway URL:", gatewayUrl);
          const response = await fetch(gatewayUrl);
          if (response.ok) {
            return await response.json();
          }
        } catch (e) {
          console.error(`Failed to fetch from ${gatewayUrl}:`, e);
          // Continue to next gateway
        }
      }
      throw new Error("All gateways failed");
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

// Completely bypass Zora's validation
const validateMetadata = async (uri: string): Promise<boolean> => {
  try {
    console.log(`Validating metadata URI: ${uri}`);
    
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
  // Clean up the inputs
  const cleanName = name.trim();
  const cleanDescription = description.trim() || "A token created with ZoRosetta";
  
  // Ensure the image URL is properly formatted
  let finalImageUrl = imageUrl;
  if (imageUrl.startsWith('ipfs://')) {
    const cid = imageUrl.replace('ipfs://', '');
    finalImageUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }
  
  return {
    name: cleanName,
    description: cleanDescription,
    image: finalImageUrl, // Using gateway URL instead of IPFS URI for better compatibility
    properties: {
      category: "social"
    }
  };
};

// Function to test if a URI is accessible by fetching it
const testUriAccessibility = async (uri: string): Promise<boolean> => {
  try {
    // For IPFS URIs, try to fetch via gateway
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      const gatewayUrls = [
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://gateway.pinata.cloud/ipfs/${cid}`
      ];
      
      for (const gatewayUrl of gatewayUrls) {
        try {
          const response = await fetch(gatewayUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`URI is accessible via: ${gatewayUrl}`);
            return true;
          }
        } catch {
          console.warn(`Failed to access via ${gatewayUrl}`);
        }
      }
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

// Add a function to switch networks using window.ethereum directly
const switchToBase = async () => {
  if (!window.ethereum) {
    alert("MetaMask is not installed!");
    return false;
  }

  try {
    // Try to switch to Base
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }], // Base chainId in hex (8453)
    });
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
        return true;
      } catch (addError) {
        console.error('Error adding Base chain:', addError);
        return false;
      }
    }
    console.error('Error switching to Base chain:', switchError);
    return false;
  }
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
          
          // Check if image is accessible
          const isImageAccessible = await testUriAccessibility(imageIpfsUrl);
          console.log("Image is accessible:", isImageAccessible);
          
          // Step 3: Create metadata JSON following EIP-7572 standard
          // Use IPFS URI for the image in metadata, not gateway URL
          const metadata = {
            name: formData.tokenName,
            description: formData.tokenDescription,
            image: imageIpfsUrl,
            properties: {
              category: "social"
            }
          };

          // Ensure the metadata is properly formatted
          if (!metadata.name || !metadata.description || !metadata.image) {
            throw new Error('Metadata is missing required fields');
          }

          // Ensure metadata is valid by checking against a schema
          const metadataValidationErrors = [];
          if (typeof metadata.name !== 'string' || metadata.name.trim() === '') {
            metadataValidationErrors.push('Name must be a non-empty string');
          }
          
          if (typeof metadata.description !== 'string') {
            metadataValidationErrors.push('Description must be a string');
          }
          
          if (typeof metadata.image !== 'string' || !metadata.image.startsWith('ipfs://')) {
            metadataValidationErrors.push('Image must be a valid IPFS URL');
          }
          
          if (metadataValidationErrors.length > 0) {
            throw new Error(`Invalid metadata: ${metadataValidationErrors.join(', ')}`);
          }

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
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if metadata is accessible
          const isMetadataAccessible = await testUriAccessibility(metadataIpfsUrl);
          console.log("Metadata is accessible:", isMetadataAccessible);
          
          // Generate alternative metadata with gateway URLs if needed
          let finalMetadataUri = metadataIpfsUrl;
          let validationSucceeded = isMetadataAccessible;
          
          if (!isMetadataAccessible) {
            console.log("IPFS metadata is not accessible, trying alternative approach");
            try {
              // Generate alternative metadata with HTTP URLs instead of IPFS URLs
              const altMetadata = generateSampleMetadata(
                formData.tokenName,
                formData.tokenDescription,
                imageUrl // Use the gateway URL instead of IPFS URL
              );
              
              console.log("Alternative metadata:", JSON.stringify(altMetadata, null, 2));
              
              // Upload the alternative metadata
              const altMetadataBlob = new Blob([JSON.stringify(altMetadata, null, 2)], { type: 'application/json' });
              const altMetadataFile = new File([altMetadataBlob], 'alt-metadata.json', { type: 'application/json' });
              
              const altMetadataFormData = new FormData();
              altMetadataFormData.append('file', altMetadataFile);
              
              const altMetadataUploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: altMetadataFormData,
              });
              
              if (altMetadataUploadResponse.ok) {
                const altMetadataResult = await altMetadataUploadResponse.json();
                const altMetadataUrl = altMetadataResult.url;
                
                console.log("Alternative metadata uploaded to:", altMetadataUrl);
                
                // Check if alternative metadata is accessible
                const isAltMetadataAccessible = await testUriAccessibility(altMetadataUrl);
                console.log("Alternative metadata is accessible:", isAltMetadataAccessible);
                
                if (isAltMetadataAccessible) {
                  finalMetadataUri = altMetadataUrl;
                  validationSucceeded = true;
                }
              }
            } catch (altError) {
              console.error("Failed to create alternative metadata:", altError);
            }
          }
          
          if (!validationSucceeded) {
            throw new Error("Could not create accessible metadata. Please try again.");
          }
          
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

        } catch (error) {
          const uploadError = error as Error;
          console.error('Upload error:', uploadError);
          alert(`Failed to upload to IPFS: ${uploadError.message}`);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
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
    
    if (!address) {
      alert("Wallet not connected!");
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
          alert("Please try creating your token again after switching to Base network");
        } else {
          alert("Failed to switch to Base network. Please switch manually and try again.");
        }
        return;
      } else {
        // User chose not to switch - warn them but allow them to proceed
        const proceedAnyway = confirm(
          "Creating tokens on networks other than Base is not recommended. Do you want to proceed anyway?"
        );
        
        if (!proceedAnyway) {
          return;
        }
        // If they still want to proceed, continue with the transaction
      }
    }

    try {
      // Validate the metadata URI with our custom validator
      console.log("Starting metadata validation for URI:", tokenFormData.uri);
      const isValid = await validateMetadata(tokenFormData.uri);
      
      if (!isValid) {
        console.error("Metadata validation failed");
        alert("The metadata URI is invalid. Please make sure it points to a valid metadata file with name and image fields.");
        return;
      }
      
      console.log("Metadata validation successful, proceeding with token creation");

      // Create coin params
      const coinParams = {
        name: tokenFormData.name,
        symbol: tokenFormData.symbol,
        uri: tokenFormData.uri,
        payoutRecipient: address as Address,
      };
      
      console.log("Creating coin with params:", coinParams);

      try {
        // Create contract call - this internally uses validateMetadataURIContent which might fail
        let contractCallParams;
        
        try {
          contractCallParams = await createCoinCall(coinParams);
          console.log("Successfully created contract call params");
        } catch (validationError) {
          console.error("Got validation error in createCoinCall:", validationError);
          
          // If the error is about metadata validation, ask the user if they want to proceed anyway
          if (validationError instanceof Error && validationError.message.includes("Metadata fetch failed")) {
            const shouldProceed = confirm(
              "There was an issue validating your token metadata. This could lead to problems with your token. Do you want to try proceeding anyway?"
            );
            
            if (!shouldProceed) {
              alert("Token creation cancelled. Please try with a different metadata URI.");
              return;
            }
            
            // If they want to proceed, we'll still throw for now
            // In a real implementation, you could try using a different approach here
            // such as directly calling the contract or using a different URI format
            throw validationError;
          } else {
            // For other errors, just throw
            throw validationError;
          }
        }
        
        // Execute the transaction if we have valid contract call params
        if (contractCallParams) {
          console.log("Executing contract with params:", contractCallParams);
          writeContract(contractCallParams);
          
          alert("Transaction initiated! Check your wallet to confirm the transaction.");
          handleCloseTokenModal();
        }
      } catch (error) {
        console.error("Error in contract creation:", error);
        
        // Show appropriate message
        if (error instanceof Error) {
          if (error.message.includes("Metadata fetch failed")) {
            alert("There was an issue validating the token metadata. Try using a different metadata URI or generating a new one.");
          } else if (error.message.includes("User rejected the request")) {
            alert("Transaction was rejected in the wallet.");
          } else {
            alert(`Failed to create token: ${error.message}`);
          }
        } else {
          alert("Failed to create token due to an unknown error.");
        }
      }
    } catch (error) {
      console.error("Error in token form submission:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <div className="mt-8 p-4 bg-[#232b3e] rounded-lg max-h-[300px] overflow-y-auto custom-scrollbar">
              <h3 className="text-lg font-semibold text-white mb-2 sticky top-0 bg-[#232b3e] py-2">Analysis</h3>
              <p className="text-gray-300 mb-4">{analysis.analysis}</p>
              
              <h3 className="text-lg font-semibold text-white mb-2 sticky top-12 bg-[#232b3e] py-2">Suggested Improvements</h3>
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
                      alert("Failed to switch networks. Please try switching manually in your wallet.");
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Create Token
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}