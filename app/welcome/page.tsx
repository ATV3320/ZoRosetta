"use client";

import { useRouter } from "next/navigation";

export default function Welcome() {
  const router = useRouter();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundImage: 'url("/glassbg0.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h1
        className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6 text-center"
        style={{ fontFamily: "'HarryP', serif" }}
      >
        Welcome to Zorosetta
      </h1>
      <p
        className="text-xl text-blue-500 mb-2 text-center"
        style={{ fontFamily: "'HarryP', serif" }}
      >
        A go-to platform with friendly interface acting as the &apos;Rosetta Stone&apos; for Zora
      </p>
      <p
        className="text-md text-purple-500 mb-8 text-center"
        style={{ fontFamily: "'HarryP', serif" }}
      >
        Enter the world of possibilities
      </p>
      <button
        className="px-8 py-3 rounded-lg text-lg font-semibold bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-lg hover:scale-105 transition-transform"
        style={{ fontFamily: "'HarryP', serif" }}
        onClick={() => router.push("/trends")}
      >
        Enter
      </button>
    </div>
  );
} 