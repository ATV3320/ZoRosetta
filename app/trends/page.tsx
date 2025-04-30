"use client";

import { useEffect, useState } from "react";
import {
  getCoinsTopVolume24h,
  getCoinsMostValuable,
  getCoinsTopGainers,
  getCoinsNew,
} from "@zoralabs/coins-sdk";
import Image from "next/image";
import { AppLayout } from "../layout";

const TABS = [
  { key: "top-volume", label: "Top Volume" },
  { key: "most-valuable", label: "Most Valuable" },
  { key: "top-gainers", label: "Top Gainers" },
  { key: "new-coins", label: "New Coins" },
];

interface MediaContent {
  mimeType?: string;
  originalUri: string;
  previewImage?: {
    small: string;
    medium: string;
    blurhash?: string;
  };
}

interface CreatorEarning {
  amount: {
    currencyAddress: string;
    amountRaw: string;
    amountDecimal: number;
  };
  amountUsd?: string;
}

interface Transfer {
  count: number;
  [key: string]: unknown;
}

interface ZoraComment {
  pageInfo: {
    endCursor?: string;
    hasNextPage: boolean;
  };
  count: number;
  edges: Array<{
    node: {
      txHash: string;
      comment: string;
      userAddress: string;
      timestamp: number;
      userProfile?: {
        id: string;
        handle: string;
        avatar?: {
          previewImage: {
            blurhash?: string;
            small: string;
            medium: string;
          };
        };
      };
    };
  }>;
}

interface Coin {
  id?: string;
  name?: string;
  description?: string;
  address?: string;
  symbol?: string;
  totalSupply?: string;
  totalVolume?: string;
  volume24h?: string;
  createdAt?: string;
  creatorAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  chainId?: number;
  uniqueHolders?: number;
  mediaContent?: MediaContent;
  creatorEarnings?: CreatorEarning[];
  transfers?: Transfer;
  zoraComments?: ZoraComment;
}

function AvatarWithSpinner({ imageUrl, alt, fallback }: { imageUrl?: string; alt: string; fallback: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg bg-blue-700 text-white overflow-hidden border border-blue-700 bg-[#232b3e] relative">
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
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover z-10"
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </>
      ) : (
        fallback
      )}
    </span>
  );
}

export default function Trends() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("top-volume");

  useEffect(() => {
    async function fetchCoins() {
      setLoading(true);
      let tokens: Coin[] = [];
      try {
        if (activeTab === "top-volume") {
          const response = await getCoinsTopVolume24h({ count: 10 });
          tokens = response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || [];
        } else if (activeTab === "most-valuable") {
          const response = await getCoinsMostValuable({ count: 10 });
          tokens = response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || [];
        } else if (activeTab === "top-gainers") {
          const response = await getCoinsTopGainers({ count: 10 });
          tokens = response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || [];
        } else if (activeTab === "new-coins") {
          const response = await getCoinsNew({ count: 10 });
          tokens = response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || [];
        }
      } catch {
        tokens = [];
      }
      setCoins(tokens);
      setLoading(false);
    }
    fetchCoins();
  }, [activeTab]);

  return (
    <AppLayout>
      <div className="p-4">
        <h1 className="text-4xl font-bold text-white mb-2">Market Trends</h1>
        <div className="flex gap-4 mt-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow ${
                activeTab === tab.key
                  ? "bg-blue-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-[#181f2e] rounded-xl shadow-lg">
            <thead>
              <tr className="text-left text-gray-400 text-sm">
                <th className="py-3 px-4">TOKEN</th>
                <th className="py-3 px-4">PRICE CHANGE</th>
                <th className="py-3 px-4">MARKET CAP</th>
                <th className="py-3 px-4">VOLUME (24H)</th>
                <th className="py-3 px-4">HOLDERS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-white">Loading...</td></tr>
              ) : coins.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No coins found.</td></tr>
              ) : (
                coins.map((coin) => {
                  const imageUrl = coin.mediaContent?.previewImage?.small || coin.mediaContent?.previewImage?.medium;
                  return (
                    <tr key={coin.address} className="border-b border-[#232b3e] hover:bg-[#232b3e] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <AvatarWithSpinner
                          imageUrl={imageUrl}
                          alt={coin.symbol || coin.name || "coin"}
                          fallback={coin.symbol?.[0] || "?"}
                        />
                        <div>
                          <div className="font-semibold text-white">{coin.name}</div>
                          <div className="text-xs text-gray-400">{coin.symbol}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-green-400 font-semibold">
                        {activeTab === "top-gainers"
                          ? coin.marketCapDelta24h
                            ? `${parseFloat(coin.marketCapDelta24h).toFixed(2)}%`
                            : "N/A"
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-white">${coin.marketCap ? coin.marketCap : "-"}</td>
                      <td className="py-3 px-4 text-white">${coin.volume24h ? coin.volume24h : "-"}</td>
                      <td className="py-3 px-4 text-white">{coin.uniqueHolders ?? "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
