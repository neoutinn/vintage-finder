/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces .next/standalone: a self-contained server Electron can spawn
  // as a child process without needing the full node_modules tree.
  output: 'standalone',
  // Playwright/Patchright have complex internal (sometimes optional/conditional)
  // requires that trip up webpack's static bundling - e.g. patchright-core's BiDi
  // support tries to resolve `chromium-bidi`, which isn't installed and isn't
  // needed for the CDP-based automation this app actually uses. Marking these
  // external tells Next to `require()` them normally at runtime instead of
  // bundling them, which is the documented fix for this class of package.
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'playwright-core', 'patchright', 'patchright-core'],
  },
};

export default nextConfig;
