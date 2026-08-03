/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces .next/standalone: a self-contained server Electron can spawn
  // as a child process without needing the full node_modules tree.
  output: 'standalone',
};

export default nextConfig;
