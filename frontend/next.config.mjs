/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // If deployed on Vercel, we let vercel.json handle the routing to the Python serverless functions.
    // Otherwise Next.js will try to proxy to 127.0.0.1 which fails with a 500 error on Vercel.
    if (process.env.VERCEL) {
      return [];
    }

    const rawAnalyticsUrl =
      process.env.NEXT_PUBLIC_ANALYTICS_API_URL ||
      process.env.ANALYTICS_URL ||
      "http://127.0.0.1:8001";
    const analyticsUrl = rawAnalyticsUrl.replace(/\/+$/, "").replace(/\/api$/, "");

    const rawPredictionUrl =
      process.env.NEXT_PUBLIC_PREDICTION_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      "http://127.0.0.1:8000";
    const predictionUrl = rawPredictionUrl.replace(/\/+$/, "");

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
