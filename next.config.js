/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" crea un bundle autocontenido óptimo para Docker / PM2
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
