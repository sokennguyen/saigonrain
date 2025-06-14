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
    windSpeed: number;
    weatherCode: string;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
    windSpeed: number[];
    weatherCode: string[];
  };
}

// Tomorrow.io Weather interpretation codes
const TOMORROW_WEATHER_CODES: { [key: string]: string } = {
  '1000': 'Clear',
  '1100': 'Mostly Clear',
  '1101': 'Partly Cloudy',
  '1102': 'Mostly Cloudy',
  '1001': 'Cloudy',
  '2000': 'Fog',
  '2100': 'Light Fog',
  '4000': 'Drizzle',
  '4001': 'Rain',
  '4200': 'Light Rain',
  '4201': 'Heavy Rain',
  '5000': 'Snow',
  '5001': 'Flurries',
  '5100': 'Light Snow',
  '5101': 'Heavy Snow',
  '6000': 'Freezing Drizzle',
  '6001': 'Freezing Rain',
  '6200': 'Light Freezing Rain',
  '6201': 'Heavy Freezing Rain',
  '7000': 'Ice Pellets',
  '7101': 'Heavy Ice Pellets',
  '7102': 'Light Ice Pellets',
  '8000': 'Thunderstorm'
};

// WMO Weather interpretation codes
const WMO_WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

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
  { name: "Thu Duc", lat: 10.8506, lon: 106.7714 },
];

const TOMORROW_API_KEY = "Qkt5ZZwuOBxiEn8diin1wtG71wbWsxNf";

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
        
        const url = `https://api.tomorrow.io/v4/timelines?location=${selectedDistrict.lat},${selectedDistrict.lon}&fields=precipitationIntensity,precipitationProbability,windSpeed,weatherCode&timesteps=current,1h&units=metric&apikey=${TOMORROW_API_KEY}`;
        console.log('API URL:', url);

        const response = await axios.get(url);

        if (!response.data) {
          throw new Error('No data received from weather service');
        }

        const timelines = response.data.data.timelines;
        const currentTimeline = timelines.find((tl: any) => tl.timestep === "current");
        const hourlyTimeline = timelines.find((tl: any) => tl.timestep === "1h");

        const currentData = currentTimeline ? currentTimeline.intervals[0] : null;
        const hourlyData = hourlyTimeline ? hourlyTimeline.intervals : [];

        const transformedData = {
          current: {
            precipitation: currentData?.values.precipitationIntensity || 0,
            time: currentData?.startTime || '',
            windSpeed: currentData?.values.windSpeed || 0,
            weatherCode: currentData?.values.weatherCode?.toString() || '1000',
          },
          hourly: {
            time: hourlyData.map((interval: any) => interval.startTime),
            precipitation_probability: hourlyData.map((interval: any) => interval.values.precipitationProbability || 0),
            precipitation: hourlyData.map((interval: any) => interval.values.precipitationIntensity || 0),
            windSpeed: hourlyData.map((interval: any) => interval.values.windSpeed || 0),
            weatherCode: hourlyData.map((interval: any) => interval.values.weatherCode?.toString() || '1000'),
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

  const getRainIntensityLabel = (precipitation: number, weatherCode: string): string => {
    if (precipitation <= 2.5) return 'Lightly';
    if (precipitation < 7.5) return 'Moderately';
    if (precipitation < 15) return 'Heavily';
    return 'Very heavily';
  };

  const isCurrentlyRaining = () => {
    if (!weatherData) return false;
    return weatherData.current.precipitation > 0.2;
  };

  const getRainEndTime = () => {
    if (!weatherData) return null;

    const now = new Date();
    const nowHCM = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHourIndex = weatherData.hourly.time.findIndex((timeStr) => {
      const forecastDate = new Date(timeStr);
      const forecastHCM = new Date(forecastDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      return (
        forecastHCM.getFullYear() === nowHCM.getFullYear() &&
        forecastHCM.getMonth() === nowHCM.getMonth() &&
        forecastHCM.getDate() === nowHCM.getDate() &&
        forecastHCM.getHours() === nowHCM.getHours()
      );
    });

    for (let i = currentHourIndex + 1; i < weatherData.hourly.time.length; i++) {
      if (weatherData.hourly.precipitation[i] <= 0.2) {
        if (i + 1 < weatherData.hourly.time.length && weatherData.hourly.precipitation[i + 1] <= 0.2) {
          return new Date(weatherData.hourly.time[i]);
        }
      }
    }
    return null;
  };

  const getNextRainTime = (): { time: Date; probability: number } | 'no_rain_today' => {
    if (!weatherData) return 'no_rain_today';
    
    const now = new Date();
    const nowHCM = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHourIndex = weatherData.hourly.time.findIndex((timeStr) => {
      const forecastDate = new Date(timeStr);
      const forecastHCM = new Date(forecastDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      return (
        forecastHCM.getFullYear() === nowHCM.getFullYear() &&
        forecastHCM.getMonth() === nowHCM.getMonth() &&
        forecastHCM.getDate() === nowHCM.getDate() &&
        forecastHCM.getHours() === nowHCM.getHours()
      );
    });

    const today = nowHCM;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Look for the first hour with precipitation probability >= 30%
    let firstRainIndex = -1;
    for (let i = currentHourIndex; i < weatherData.hourly.time.length; i++) {
      if (weatherData.hourly.precipitation_probability[i] >= 30) {
        firstRainIndex = i;
        break;
      }
    }

    if (firstRainIndex === -1) return 'no_rain_today';

    const nextRainTime = new Date(weatherData.hourly.time[firstRainIndex]);
    const nextRainHCM = new Date(nextRainTime.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    if (nextRainHCM >= tomorrow) {
      return 'no_rain_today';
    }

    return { time: nextRainHCM, probability: weatherData.hourly.precipitation_probability[firstRainIndex] };
  };

  const getCurrentProbability = () => {
    if (!weatherData) return 0;
    
    const now = new Date();
    const nowHCM = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHourIndex = weatherData.hourly.time.findIndex((timeStr) => {
      const forecastDate = new Date(timeStr);
      const forecastHCM = new Date(forecastDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      return (
        forecastHCM.getFullYear() === nowHCM.getFullYear() &&
        forecastHCM.getMonth() === nowHCM.getMonth() &&
        forecastHCM.getDate() === nowHCM.getDate() &&
        forecastHCM.getHours() === nowHCM.getHours()
      );
    });
    
    // Handle case where currentHourIndex might be -1 if the current hour is not in the forecast data
    if (currentHourIndex === -1) return 0;

    return weatherData.hourly.precipitation_probability[currentHourIndex];
  };

  const formatTime = (date: Date | 'no_rain_today' | 'already_stopped') => {
    if (date === 'no_rain_today') {
      return 'For the next 24 hours, yay! 🌞';
    }
    if (date === 'already_stopped') {
      return 'Rain has just stopped';
    }

    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();

    const dateStr = isToday ? 'Today' : 
      `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    return `${dateStr} ${date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Ho_Chi_Minh'
    })}`;
  };

  // Helper to get rain probability message
  const getRainProbabilityMessage = (prob: number) => {
    if (prob <= 20) return 'No rain expected';
    if (prob <= 40) return 'Slight chance of rain';
    if (prob <= 60) return 'Chance of rain';
    return 'Rain likely';
  };

  const nextRainForecast = getNextRainTime();

  // Debug log to check the value of nextRainForecast
  console.log('nextRainForecast:', nextRainForecast);

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
            {isCurrentlyRaining() ? (
              <>
                Is Raining {getRainIntensityLabel(weatherData?.current.precipitation || 0, weatherData?.current.weatherCode || '1000')} ☔️ ({weatherData?.current.precipitation.toFixed(1)} mm)
              </>
            ) : (
              "Not Raining ☀️"
            )}
          </h2>

          {/* Expected rain stop/next rain time */}
          {isCurrentlyRaining() && getRainEndTime() && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginTop: '0.5rem', textAlign: 'center', color: '#000000' }}>
                Expected to stop around:{' '}
                <span style={{ fontWeight: '600', color: '#000000' }}>
                  {formatTime(getRainEndTime()!)}
                </span>
              </p>
            </div>
          )}
          {!isCurrentlyRaining() && nextRainForecast && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ textAlign: 'center' }}>
                {typeof nextRainForecast === 'string' ? (
                  <span style={{ fontWeight: '600', color: '#000000' }}>
                    {formatTime('no_rain_today')}
                  </span>
                ) : (
                  <>
                    <span style={{ color: '#000000' }}>
                      Expected next rain:{' '}
                    </span>
                    <span style={{ fontWeight: '600', color: '#000000' }}>
                      {formatTime(nextRainForecast.time)}
                    </span>
                    <span style={{ color: '#2563eb', fontWeight: 500, marginLeft: 4 }}>
                      {' '}({getRainProbabilityMessage(nextRainForecast.probability)})
                    </span>
                  </>
                )}
              </p>
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