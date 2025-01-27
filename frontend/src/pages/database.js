import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function Database() {
  const [locations, setLocations] = useState([]);
  const [weatherRecords, setWeatherRecords] = useState([]);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ temperature: '', description: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get locations
      const locationsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/locations/`);
      setLocations(locationsRes.data);

      // Get all weather records for each location
      const weatherPromises = locationsRes.data.map(location => 
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/weather/past_searches/${location.city}`)
      );
      const weatherResults = await Promise.all(weatherPromises);
      const allWeatherRecords = weatherResults.flatMap(res => res.data);
      setWeatherRecords(allWeatherRecords);

      // Get historical records for each location
      const historicalPromises = locationsRes.data.map(location =>
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/historical-weather/${location.city}`, {
          params: {
            start_date: new Date('1979-01-01').toISOString(),
            end_date: new Date().toISOString()
          }
        })
      );
      const historicalResults = await Promise.all(historicalPromises);
      const allHistoricalRecords = historicalResults.flatMap(res => res.data);
      setHistoricalRecords(allHistoricalRecords);

    } catch (err) {
      setError('Failed to fetch database records');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}? ${type === 'location' ? 'This will also delete all associated weather records.' : ''}`)) {
      return;
    }

    try {
      if (type === 'location') {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/locations/${id}`);
      } else if (type === 'weather') {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/weather/${id}`);
      } else if (type === 'historical') {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/weather/${id}`);
      }
      
      // Refresh the data
      await fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record. Please try again.');
    }
  };

  const handleEdit = (record, type) => {
    setEditingRecord({ ...record, type });
    setEditForm({
      temperature: record.temperature,
      description: record.description
    });
  };

  const handleSave = async () => {
    try {
      // Get current values from refs
      const temperatureInput = document.querySelector('input[name="temperature"]');
      const descriptionInput = document.querySelector('input[name="description"]');
      
      const tempValue = parseFloat(temperatureInput?.value || '');
      const descValue = descriptionInput?.value || '';

      // Validate temperature
      if (isNaN(tempValue)) {
        alert('Temperature must be a valid number');
        return;
      }

      // Validate description
      if (descValue.length > 20) {
        alert('Description must be 20 characters or less');
        return;
      }

      const endpoint = editingRecord.type === 'historical' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/historical-weather/${editingRecord.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/weather/${editingRecord.id}`;

      await axios.put(endpoint, {
        temperature: tempValue,
        description: descValue
      });

      setEditingRecord(null);
      setEditForm({ temperature: '', description: '' });
      await fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      alert('Failed to update record. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setEditForm({ temperature: '', description: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'temperature' && value !== '' && isNaN(value)) {
      return; // Don't update if it's not a valid number
    }
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const TableSection = ({ title, data, columns, type }) => {
    const getActionColumn = (item) => (
      <div className="space-x-2">
        {editingRecord?.id === item.id ? (
          <>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors duration-150"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition-colors duration-150"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {(type === 'weather' || type === 'historical') && (
              <button
                onClick={() => handleEdit(item, type)}
                className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors duration-150"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => handleDelete(type, item.id)}
              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-150"
            >
              Delete
            </button>
          </>
        )}
      </div>
    );

    const EditableCell = ({ item, column, value }) => {
      const inputRef = useRef(null);

      useEffect(() => {
        if (editingRecord?.id === item.id && inputRef.current) {
          // Set initial value when editing starts
          inputRef.current.value = editForm[column.toLowerCase()];
          inputRef.current.focus();
        }
      }, [editingRecord?.id, item.id]);

      const handleLocalChange = (e) => {
        const { name, value } = e.target;
        // For temperature, only allow numbers and decimal point
        if (name === 'temperature') {
          if (value === '' || /^\d*\.?\d*$/.test(value)) {
            // Only update parent state when saving
            return;
          }
          // Reset invalid input
          e.target.value = e.target.value.replace(/[^\d.]/g, '');
          return;
        }
      };

      if (editingRecord?.id === item.id) {
        if (column === 'Temperature') {
          return (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              name="temperature"
              defaultValue={editForm.temperature}
              onChange={handleLocalChange}
              className="border rounded px-2 py-1 w-24"
              autoComplete="off"
              placeholder="Enter number"
            />
          );
        }
        if (column === 'Description') {
          return (
            <input
              ref={inputRef}
              type="text"
              name="description"
              defaultValue={editForm.description}
              maxLength={20}
              className="border rounded px-2 py-1 w-48"
              autoComplete="off"
            />
          );
        }
      }
      return value;
    };

    return (
      <div className="mb-8">
        {title}
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-primary-700">
                {columns.map((column, index) => (
                  <th key={index} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    {column}
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-primary-50 transition-colors duration-150">
                  {columns.map((column, columnIndex) => (
                    <td key={columnIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100">
                      <EditableCell
                        item={item}
                        column={column}
                        value={getValue(item, column)}
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getActionColumn(item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getValue = (item, column) => {
    const columnMap = {
      'ID': item.id,
      'City': item.city,
      'Country': item.country,
      'Latitude': item.latitude,
      'Longitude': item.longitude,
      'Location ID': item.location_id,
      'Temperature': item.temperature,
      'Humidity': item.humidity,
      'Pressure': item.pressure,
      'Description': item.description,
      'Timestamp': item.timestamp,
      'Query Date': item.query_timestamp
    };
    
    const value = columnMap[column];
    
    if (typeof value === 'number' && column.toLowerCase().includes('temp')) {
      return `${value.toFixed(2)}°C`;
    }
    if (column.toLowerCase().includes('time') || column.toLowerCase().includes('date')) {
      return formatDate(value);
    }
    return String(value || '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Head>
        <title>Database Records - Weather App</title>
        <meta name="description" content="View and edit database records" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-primary-900 mb-12 tracking-tight">
          Database Records
        </h1>

        <div className="space-y-12">
          <TableSection
            title={
              <h2 className="text-2xl font-bold text-primary-800 mb-6 border-b-2 border-primary-200 pb-2">
                Locations
              </h2>
            }
            data={locations}
            columns={['ID', 'City', 'Country', 'Latitude', 'Longitude']}
            type="location"
          />

          <TableSection
            title={
              <h2 className="text-2xl font-bold text-primary-800 mb-6 border-b-2 border-primary-200 pb-2">
                Current Weather Records
              </h2>
            }
            data={weatherRecords}
            columns={['ID', 'Location ID', 'Temperature', 'Humidity', 'Pressure', 'Description', 'Timestamp']}
            type="weather"
          />

          <TableSection
            title={
              <h2 className="text-2xl font-bold text-primary-800 mb-6 border-b-2 border-primary-200 pb-2">
                Historical Weather Records
              </h2>
            }
            data={historicalRecords}
            columns={['ID', 'Location ID', 'Temperature', 'Humidity', 'Pressure', 'Description', 'Query Date', 'Timestamp']}
            type="historical"
          />
        </div>
      </main>
    </div>
  );
} 