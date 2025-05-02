"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Welcome() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: 'url("/glassbg0.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background: 'linear-gradient(to right, rgba(0, 123, 255, 0.6), rgba(255, 105, 180, 0.6), rgba(0, 123, 255, 0.6))',
          backgroundSize: '300% 100%',
          mixBlendMode: 'color',
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,0,0,0.2), transparent)`,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <h1
          className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6 text-center"
          style={{ fontFamily: "'HarryP', serif" }}
        >
          Welcome to ZoRosetta
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
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 150% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
} 