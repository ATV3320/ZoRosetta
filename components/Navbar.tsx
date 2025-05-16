"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Market Trends", href: "/trends" },
  { name: "Advanced Insights", href: "/advanced-insights" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-[#1a1f2e] border-r border-gray-800 p-4">
      <div className="space-y-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            ZoRosetta
          </h1>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-blue-500/10 text-blue-500"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 