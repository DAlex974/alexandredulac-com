/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.alexandredulac.com",
          },
        ],
        destination: "https://alexandredulac.com/:path*",
        permanent: true,
      },
      {
        source: "/intro",
        destination: "https://calendar.app.google/we9AXs7jdZsbdwcZ8",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
