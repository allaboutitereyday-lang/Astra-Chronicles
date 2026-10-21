/** @type {import('next').NextConfig} */
const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

const nextConfig = {
  ...(isElectronBuild ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
