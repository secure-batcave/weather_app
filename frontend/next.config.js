/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/weather/current/:city',
        destination: 'http://backend:8000/weather/current/:city',
      },
      {
        source: '/api/weather/forecast/:city',
        destination: 'http://backend:8000/weather/forecast/:city',
      },
      {
        source: '/api/weather/historical/:city',
        destination: 'http://backend:8000/weather/historical/:city',
      },
      {
        source: '/api/weather/past_searches/:city',
        destination: 'http://backend:8000/weather/past_searches/:city',
      },
      {
        source: '/api/weather/:id',
        destination: 'http://backend:8000/weather/:id',
      },
      {
        source: '/api/locations',
        destination: 'http://backend:8000/locations',
      },
      {
        source: '/api/export/:city',
        destination: 'http://backend:8000/export/:city',
      }
    ]
  },
}

module.exports = nextConfig
