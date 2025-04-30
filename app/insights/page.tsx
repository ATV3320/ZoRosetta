"use client";

import { AppLayout } from "@/app/components/AppLayout";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Insights() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6"
          >
            Coming Soon
          </motion.h1>
          
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-[#1a1f2e] p-8 rounded-2xl shadow-xl border border-gray-800">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-gray-300 mb-8"
              >
                Coming in Wave 4 with the best integration of Zora Coins SDK with AI
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 rounded-lg text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Back to Dashboard
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
