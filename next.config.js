/** @type {import('next').NextConfig} */
const nextConfig = {
  // calc-core ships TypeScript source; Next compiles it in place.
  transpilePackages: ["@papilio/calc-core"],
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
