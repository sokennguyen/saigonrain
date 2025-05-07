import { useState, useEffect } from 'react';
import axios from 'axios';

interface District {
  name: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  current: {
    precipitation: number;
    time: string;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
  };
}

// HCMC Districts with approximate coordinates
const districts: District[] = [
  { name: "District 1", lat: 10.7756, lon: 106.7019 },
  { name: "District 2 (Thu Duc)", lat: 10.7872, lon: 106.7516 },
  { name: "District 3", lat: 10.7800, lon: 106.6822 },
  { name: "District 4", lat: 10.7579, lon: 106.7044 },
  { name: "District 5", lat: 10.7539, lon: 106.6633 },
  { name: "District 6", lat: 10.7480, lon: 106.6352 },
  { name: "District 7", lat: 10.7338, lon: 106.7018 },
  { name: "District 8", lat: 10.7240, lon: 106.6283 },
  { name: "District 10", lat: 10.7729, lon: 106.6687 },
  { name: "District 11", lat: 10.7669, lon: 106.6504 },
  { name: "Binh Thanh", lat: 10.8109, lon: 106.7091 },
  { name: "Phu Nhuan", lat: 10.7989, lon: 106.6839 },
  { name: "Tan Binh", lat: 10.8031, lon: 106.6537 },
];

export default function RainForecast() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District>(districts[0]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedDistrict.lat}&longitude=${selectedDistrict.lon}&current=precipitation,rain&hourly=precipitation_probability,precipitation,rain&timezone=Asia/Ho_Chi_Minh`
        );

        if (!response.data) {
          throw new Error('No data received from weather service');
        }

        const transformedData = {
          current: {
            precipitation: response.data.current.precipitation || response.data.current.rain || 0,
            time: response.data.current.time,
          },
          hourly: {
            time: response.data.hourly.time,
            precipitation_probability: response.data.hourly.precipitation_probability,
            precipitation: response.data.hourly.precipitation.map((p: number, i: number) => 
              p || response.data.hourly.rain[i] || 0
            ),
          },
        };

        setWeatherData(transformedData);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(
          err instanceof Error 
            ? `Failed to fetch weather data: ${err.message}` 
            : 'Failed to fetch weather data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [selectedDistrict]);

  const getRainIntensityLabel = (precipitation: number): string => {
    if (precipitation === 0) return 'No rain';
    if (precipitation < 0.5) return 'Very light rain (Drizzle)';
    if (precipitation < 2.5) return 'Light rain';
    if (precipitation < 7.5) return 'Moderate rain';
    if (precipitation < 15) return 'Heavy rain';
    return 'Very heavy rain';
  };

  const isCurrentlyRaining = () => {
    return weatherData?.current.precipitation && weatherData.current.precipitation > 0;
  };

  const getNextRainTime = () => {
    if (!weatherData) return null;
    
    const currentHourIndex = weatherData.hourly.time.findIndex(
      time => new Date(time).getHours() === new Date().getHours()
    );

    for (let i = currentHourIndex; i < weatherData.hourly.time.length; i++) {
      if (weatherData.hourly.precipitation_probability[i] >= 40) {
        return new Date(weatherData.hourly.time[i]);
      }
    }
    return null;
  };

  const getRainEndTime = () => {
    if (!weatherData) return null;
    
    const currentHourIndex = weatherData.hourly.time.findIndex(
      time => new Date(time).getHours() === new Date().getHours()
    );

    for (let i = currentHourIndex; i < weatherData.hourly.time.length; i++) {
      if (weatherData.hourly.precipitation[i] === 0) {
        return new Date(weatherData.hourly.time[i]);
      }
    }
    return null;
  };

  const getCurrentProbability = () => {
    if (!weatherData) return 0;
    
    const currentHourIndex = weatherData.hourly.time.findIndex(
      time => new Date(time).getHours() === new Date().getHours()
    );
    
    return weatherData.hourly.precipitation_probability[currentHourIndex];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Saigon Rain Forecast
        </h1>

        <div className="mb-6">
          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
            Select District
          </label>
          <select
            id="district"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedDistrict.name}
            onChange={(e) => {
              const district = districts.find(d => d.name === e.target.value);
              if (district) setSelectedDistrict(district);
            }}
          >
            {districts.map((district) => (
              <option key={district.name} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        
        {isCurrentlyRaining() ? (
          <div className="mb-4">
            <p className="text-lg text-blue-600">It's currently raining! ☔️</p>
            <p className="text-md text-gray-700 mt-1">
              Intensity: {getRainIntensityLabel(weatherData?.current.precipitation || 0)}
              <br />
              <span className="text-sm text-gray-500">
                ({weatherData?.current.precipitation.toFixed(1)} mm/h)
              </span>
            </p>
            {getRainEndTime() && (
              <p className="mt-2">
                Expected to stop around:{' '}
                <span className="font-semibold">
                  {getRainEndTime()?.toLocaleTimeString()}
                </span>
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-lg text-gray-600">It's not raining right now ☀️</p>
            {getNextRainTime() && (
              <p className="mt-2">
                Next rain expected around:{' '}
                <span className="font-semibold">
                  {getNextRainTime()?.toLocaleTimeString()}
                </span>
                <br />
                <span className="text-sm text-gray-500">
                  Probability: {getCurrentProbability()}%
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 