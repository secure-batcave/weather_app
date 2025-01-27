import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function Home() {
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  // Calculate the valid date range (from January 1st, 1979 to 5 days ago)
  const minDate = '1979-01-01';
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - 5);  // 5 days ago
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Basic client-side validation
  const validateCity = (input) => {
    if (input.length < 2) {
      return 'City name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z\s-]+$/.test(input)) {
      return 'City name can only contain letters, spaces, and hyphens';
    }
    return '';
  };

  // Debounced geocoding API call
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (city.length < 2) {
        setSuggestions([]);
        return;
      }

      const validationError = validateCity(city);
      if (validationError) {
        setError(validationError);
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await axios.get(
          `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        
        const uniqueCities = response.data.filter((item, index, self) =>
          index === self.findIndex((t) => (
            t.name === item.name && t.country === item.country && t.state === item.state
          ))
        );
        
        setSuggestions(uniqueCities);
      } catch (err) {
        setError('Failed to fetch city suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [city]);

  const handleSuggestionClick = (suggestion) => {
    setSelectedCity(suggestion);
    setSuggestions([]); // Clear suggestions after selection
  };

  const handleGetCurrentWeather = () => {
    if (selectedCity) {
      router.push(`/weather?city=${encodeURIComponent(selectedCity.name)}&lat=${selectedCity.lat}&lon=${selectedCity.lon}`);
    }
  };

  const handleGetHistoricalWeather = () => {
    if (selectedCity && startDate && endDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      router.push(
        `/weather?city=${encodeURIComponent(selectedCity.name)}&lat=${selectedCity.lat}&lon=${selectedCity.lon}&start=${startTimestamp}&end=${endTimestamp}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Head>
        <title>Weather App</title>
        <meta name="description" content="Weather application with CRUD functionality" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-center text-primary-900 mb-4 tracking-tight">
            Weather App
          </h1>
          <p className="text-xl text-center text-primary-700 mb-12">
            Get current and historical weather data for any city
          </p>
          
          <button
            onClick={() => router.push('/database')}
            className="w-full mb-8 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors duration-150 shadow-md text-lg font-semibold"
          >
            View/Edit Database
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="relative mb-6">
              <label htmlFor="city" className="block text-lg font-semibold text-primary-900 mb-2">
                Enter City Name
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setError('');
                }}
                placeholder="e.g., London"
                className="w-full px-6 py-3 text-lg border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {error}
                </p>
              )}
              
              {loading && (
                <p className="mt-2 text-sm text-primary-600 font-medium">
                  Loading suggestions...
                </p>
              )}

              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-primary-200 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.name}-${suggestion.country}-${suggestion.state || ''}`}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-6 py-3 text-left hover:bg-primary-50 focus:outline-none focus:bg-primary-50 transition-colors duration-150"
                    >
                      <span className="font-semibold">{suggestion.name}</span>
                      {suggestion.state && <span className="text-primary-600">, {suggestion.state}</span>}
                      {suggestion.country && <span className="text-primary-600"> ({suggestion.country})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCity && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                  <p className="font-semibold text-primary-900">
                    Selected: <span className="font-bold">{selectedCity.name}</span>
                    {selectedCity.state && <span className="text-primary-700">, {selectedCity.state}</span>}
                    {selectedCity.country && <span className="text-primary-700"> ({selectedCity.country})</span>}
                  </p>
                </div>

                <button
                  onClick={handleGetCurrentWeather}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors duration-150 shadow-md text-lg font-semibold"
                >
                  Get Current Weather
                </button>

                <div className="border-t-2 border-primary-100 pt-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-4">Historical Weather</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-semibold text-primary-700 mb-2">
                        Start Date
                        <span className="text-xs font-normal text-primary-500 ml-1">(1979-01-01 to 5 days ago)</span>
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={minDate}
                        max={maxDateStr}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-semibold text-primary-700 mb-2">
                        End Date
                        <span className="text-xs font-normal text-primary-500 ml-1">(Start date to 5 days ago)</span>
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || minDate}
                        max={maxDateStr}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGetHistoricalWeather}
                    disabled={!startDate || !endDate}
                    className={`w-full px-6 py-3 rounded-xl text-lg font-semibold transition-colors duration-150 shadow-md ${
                      startDate && endDate
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Get Historical Weather
                  </button>
                  {startDate && endDate && (
                    <p className="mt-3 text-sm text-primary-600 text-center">
                      Note: Historical data is available from January 1st, 1979 up to 5 days ago
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
