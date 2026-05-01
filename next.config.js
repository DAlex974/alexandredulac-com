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
    ];
  },
};

module.exports = nextConfig;
