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
  { name: "District 2", lat: 10.7872, lon: 106.7516 },
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

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let firstRainIndex = -1;
    for (let i = currentHourIndex; i < weatherData.hourly.time.length; i++) {
      if (weatherData.hourly.precipitation_probability[i] >= 40) {
        firstRainIndex = i;
        break;
      }
    }

    if (firstRainIndex === -1) return null;

    const nextRainTime = new Date(weatherData.hourly.time[firstRainIndex]);
    if (nextRainTime >= tomorrow) {
      return 'no_rain_today';
    }

    return nextRainTime;
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

  const formatTime = (date: Date | 'no_rain_today') => {
    if (date === 'no_rain_today') {
      return 'For the next 24 hours, yay! 🌞';
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f3f4f6',
      padding: '1rem',
      boxSizing: 'border-box',
      position: 'absolute',
      left: 0,
      top: 0
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem'
      }}>
        {/* District title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <select
              value={selectedDistrict.name}
              onChange={(e) => {
                const district = districts.find(d => d.name === e.target.value);
                if (district) setSelectedDistrict(district);
              }}
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'transparent',
                textAlign: 'center',
                appearance: 'none',
                cursor: 'pointer',
                color: '#000000'
              }}
            >
              {districts.map((district) => (
                <option key={district.name} value={district.name} style={{ color: '#000000' }}>
                  {district.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000', marginLeft: '8px' }}>
              , Ho Chi Minh City
            </span>
          </div>
        </div>
        
        {/* Rain status */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: isCurrentlyRaining() ? '#2563eb' : '#000000' 
          }}>
            Is {isCurrentlyRaining() ? "Raining ☔️" : "Not Raining ☀️"}
          </h2>

          {isCurrentlyRaining() ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ textAlign: 'center', color: '#000000' }}>
                Intensity: {getRainIntensityLabel(weatherData?.current.precipitation || 0)}
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  ({weatherData?.current.precipitation.toFixed(1)} mm/h)
                </span>
              </p>
              {getRainEndTime() && (
                <p style={{ marginTop: '0.5rem', textAlign: 'center', color: '#000000' }}>
                  Expected to stop around:{' '}
                  <span style={{ fontWeight: '600', color: '#000000' }}>
                    {getRainEndTime() && formatTime(getRainEndTime()!)}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {getNextRainTime() && (
                <p style={{ textAlign: 'center' }}>
                  {getNextRainTime() === 'no_rain_today' ? (
                    <span style={{ fontWeight: '600', color: '#000000' }}>
                      {formatTime('no_rain_today')}
                    </span>
                  ) : (
                    <>
                      <span style={{ color: '#000000' }}>
                        Next rain expected around:{' '}
                      </span>
                      <span style={{ fontWeight: '600', color: '#000000' }}>
                        {formatTime(getNextRainTime()!)}
                      </span>
                      <span style={{ color: '#6b7280' }}>
                        {' '}({getCurrentProbability()}%)
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Last updated */}
        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
            Last updated: {' '}
            {new Date().toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Ho_Chi_Minh'
            })}
          </p>
        </div>
      </div>
    </div>
  );
} 