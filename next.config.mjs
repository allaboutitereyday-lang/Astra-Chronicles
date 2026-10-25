/** @type {import('next').NextConfig} */
const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

const nextConfig = {
  ...(isElectronBuild ? { output: 'export' } : {}),
  compress: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
