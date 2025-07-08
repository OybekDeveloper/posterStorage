/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Barcha route'lar uchun ruxsat beriladi
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // yoki "SAMEORIGIN", agar iframe bir domen ichida bo‘lsa
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *", // yoki aniq domen: "frame-ancestors https://app.joinposter.com"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // kerak bo‘lsa o‘zgartiring: "https://app.joinposter.com"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
