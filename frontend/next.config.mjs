/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || "http://127.0.0.1:8001";
    const predictionUrl =
      process.env.NEXT_PUBLIC_PREDICTION_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";
    return [
      {
        source: "/analytics-api/:path*",
        destination: `${analyticsUrl}/api/:path*`,
      },
      {
        source: "/prediction-api/:path*",
        destination: `${predictionUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
