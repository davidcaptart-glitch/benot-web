/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" crea un bundle autocontenido óptimo para Docker
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Fuerza la inclusión de sharp en el output standalone.
  // Necesario porque con `images.unoptimized: true` Next.js no incluye
  // sharp automáticamente, pero nuestro analizador de color lo usa.
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./node_modules/sharp/**/*"],
    },
  },
};

module.exports = nextConfig;
