import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { format } from 'date-fns';

export default function Weather() {
  const router = useRouter();
  const { city, lat, lon, start, end } = router.query;
  
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [pastSearches, setPastSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    if (city && lat && lon) {
      if (start && end) {
        fetchHistoricalData();
      } else {
        fetchWeatherData();
      }
    }
  }, [city, lat, lon, start, end]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create an array of timestamps for each day in the range
      const startDate = new Date(parseInt(start) * 1000);
      const endDate = new Date(parseInt(end) * 1000);
      const timestamps = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        timestamps.push(Math.floor(currentDate.getTime() / 1000));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fetch historical data for each timestamp
      const historicalPromises = timestamps.map(timestamp =>
        axios.get(`/api/weather/historical/${encodeURIComponent(city)}?timestamp=${timestamp}&lat=${lat}&lon=${lon}`)
      );

      const responses = await Promise.all(historicalPromises);
      setHistoricalData(responses.map(res => res.data));

    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err.response?.data?.detail || 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current weather using coordinates
      const currentRes = await axios.get(`/api/weather/current/${encodeURIComponent(city)}?lat=${lat}&lon=${lon}`);
      setCurrentWeather(currentRes.data);

      // Fetch forecast using coordinates
      const forecastRes = await axios.get(`/api/weather/forecast/${encodeURIComponent(city)}?lat=${lat}&lon=${lon}`);
      setForecast(forecastRes.data);

      // Fetch past searches
      const pastSearchesRes = await axios.get(`/api/weather/past_searches/${encodeURIComponent(city)}`);
      setPastSearches(pastSearchesRes.data);

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err.response?.data?.detail || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await axios.delete(`/api/weather/${recordId}`);
      // Refresh past searches after deletion
      const pastSearchesRes = await axios.get(`/api/weather/past_searches/${encodeURIComponent(city)}`);
      setPastSearches(pastSearchesRes.data);
    } catch (err) {
      setError('Failed to delete record');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/export/${encodeURIComponent(city)}`);
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather_data_${city}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-primary-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Head>
        <title>Weather - {city}</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Current Weather or Historical Data */}
        {!start && !end && currentWeather && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-primary-900 mb-6 border-b-2 border-primary-200 pb-2">
              Current Weather in {city}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md">
                <div className="text-lg font-semibold text-primary-700 mb-2">Temperature</div>
                <div className="text-3xl font-bold text-primary-900">{currentWeather.temperature.toFixed(1)}°C</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md">
                <div className="text-lg font-semibold text-primary-700 mb-2">Humidity</div>
                <div className="text-3xl font-bold text-primary-900">{currentWeather.humidity}%</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md">
                <div className="text-lg font-semibold text-primary-700 mb-2">Pressure</div>
                <div className="text-3xl font-bold text-primary-900">{currentWeather.pressure} hPa</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md">
                <div className="text-lg font-semibold text-primary-700 mb-2">Description</div>
                <div className="text-3xl font-bold text-primary-900 capitalize">{currentWeather.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Data */}
        {start && end && historicalData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-primary-900 mb-2">
              Historical Weather in {city}
            </h2>
            <p className="text-lg text-primary-600 mb-6 border-b-2 border-primary-200 pb-2">
              {format(new Date(parseInt(start) * 1000), 'MMM dd, yyyy')} - {format(new Date(parseInt(end) * 1000), 'MMM dd, yyyy')}
            </p>
            <div className="grid grid-cols-1 gap-6">
              {historicalData.map((data, index) => (
                <div key={index} className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div>
                      <div className="text-lg font-semibold text-primary-700 mb-2">Date</div>
                      <div className="text-xl font-bold text-primary-900">
                        {format(new Date(data.timestamp), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-primary-700 mb-2">Temperature</div>
                      <div className="text-xl font-bold text-primary-900">{data.temperature.toFixed(1)}°C</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-primary-700 mb-2">Humidity</div>
                      <div className="text-xl font-bold text-primary-900">{data.humidity}%</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-primary-700 mb-2">Pressure</div>
                      <div className="text-xl font-bold text-primary-900">{data.pressure} hPa</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-primary-700 mb-2">Description</div>
                      <div className="text-xl font-bold text-primary-900 capitalize">{data.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Forecast only for current weather view */}
        {!start && !end && forecast.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-primary-900 mb-6 border-b-2 border-primary-200 pb-2">5-Day Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {forecast.map((item, index) => (
                <div key={index} className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md">
                  <div className="text-lg font-semibold text-primary-700 mb-2">
                    {format(new Date(item.timestamp), 'MMM dd, HH:mm')}
                  </div>
                  <div className="text-2xl font-bold text-primary-900 mb-2">{item.temperature.toFixed(1)}°C</div>
                  <div className="text-lg text-primary-800 capitalize">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Past Searches section only for current weather view */}
        {!start && !end && pastSearches.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary-200 pb-2">
              <h2 className="text-3xl font-bold text-primary-900">Past Searches for {city}</h2>
              <button
                onClick={handleExport}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-150 shadow-md"
              >
                Export Data
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-primary-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Temperature</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Humidity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Pressure</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastSearches.map((record) => (
                    <tr key={record.id} className="hover:bg-primary-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100">
                        {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100">{record.temperature.toFixed(1)}°C</td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100">{record.humidity}%</td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100">{record.pressure} hPa</td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100 capitalize">{record.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
