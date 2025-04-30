import type { NextConfig } from "next";
import { useState } from "react";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'scontent-iad4-1.choicecdn.com',
      // add any other domains you need here
    ],
  },
};

export default nextConfig;
