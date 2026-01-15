import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, Search, Loader2, CloudSun, CloudFog } from "lucide-react";

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  wind: number;
  feelsLike: number;
  high: number;
  low: number;
}

interface ForecastDay {
  day: string;
  date: string;
  high: number;
  low: number;
  conditionCode: number;
}

function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 3) return CloudSun;
  if (code <= 49) return CloudFog;
  if (code <= 69) return CloudRain;
  if (code <= 79) return CloudSnow;
  return Cloud;
}

function getBackgroundGradient(code: number): string {
  if (code === 0) return "from-orange-400 via-yellow-300 to-blue-400";
  if (code <= 3) return "from-blue-400 via-blue-300 to-yellow-200";
  if (code <= 49) return "from-gray-400 via-gray-300 to-blue-300";
  if (code <= 69) return "from-gray-600 via-blue-400 to-gray-500";
  if (code <= 79) return "from-blue-200 via-white to-gray-200";
  return "from-gray-500 via-purple-400 to-gray-600";
}

export function WeatherApp() {
  const [searchCity, setSearchCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const fetchWeatherByCoords = async (lat: number, lon: number, cityName?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
      
      const response = await fetch(weatherUrl);
      if (!response.ok) throw new Error("Failed to fetch weather");
      
      const data = await response.json();
      
      let city = cityName || "Your Location";
      if (!cityName) {
        try {
          const geoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Your Location";
          }
        } catch {
          city = "Your Location";
        }
      }

      const current = data.current;
      const daily = data.daily;

      setWeather({
        city,
        temp: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weather_code),
        conditionCode: current.weather_code,
        humidity: current.relative_humidity_2m,
        wind: Math.round(current.wind_speed_10m * 0.621371),
        feelsLike: Math.round(current.apparent_temperature),
        high: Math.round(daily.temperature_2m_max[0]),
        low: Math.round(daily.temperature_2m_min[0]),
      });

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const forecastData: ForecastDay[] = daily.time.slice(0, 7).map((date: string, i: number) => {
        const d = new Date(date);
        return {
          day: days[d.getDay()],
          date,
          high: Math.round(daily.temperature_2m_max[i]),
          low: Math.round(daily.temperature_2m_min[i]),
          conditionCode: daily.weather_code[i],
        };
      });
      
      setForecast(forecastData);
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchCityWeather = async (cityQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error("City not found");
      
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }
      
      const result = geoData.results[0];
      setCoords({ lat: result.latitude, lon: result.longitude });
      await fetchWeatherByCoords(result.latitude, result.longitude, result.name);
    } catch (err) {
      setError("City not found. Try another search.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lon: longitude });
          fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
          console.warn("Geolocation denied, using default location");
          setCoords({ lat: 40.7128, lon: -74.006 });
          fetchWeatherByCoords(40.7128, -74.006, "New York");
        }
      );
    } else {
      setCoords({ lat: 40.7128, lon: -74.006 });
      fetchWeatherByCoords(40.7128, -74.006, "New York");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      searchCityWeather(searchCity.trim());
      setSearchCity("");
    }
  };

  if (loading && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <p className="text-white mt-4">Getting your weather...</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 p-6">
        <Cloud className="w-16 h-16 text-white/60 mb-4" />
        <p className="text-white text-center">{error}</p>
        <button 
          onClick={() => coords && fetchWeatherByCoords(coords.lat, coords.lon)}
          className="mt-4 px-4 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.conditionCode);

  return (
    <div className={`h-full flex flex-col bg-gradient-to-br ${getBackgroundGradient(weather.conditionCode)}`}>
      {/* Search Bar */}
      <div className="p-4">
        <form onSubmit={handleSearch} className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="Search city..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:border-white/50 text-sm"
            data-testid="input-weather-search"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-white/60" />
            )}
          </button>
        </form>
      </div>

      {/* Current Weather */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white">
        <h2 className="text-lg font-medium opacity-90">{weather.city}</h2>
        <WeatherIcon className="w-24 h-24 my-4 drop-shadow-lg" />
        <div className="text-7xl font-light mb-2">{weather.temp}°</div>
        <p className="text-lg capitalize opacity-80">{weather.condition}</p>
        
        <div className="flex items-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            <span>Feels like {weather.feelsLike}°</span>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-4 text-sm opacity-80">
          <span>H: {weather.high}°</span>
          <span>L: {weather.low}°</span>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <Droplets className="w-5 h-5 text-white/70" />
          <span className="text-white text-sm font-medium">{weather.humidity}%</span>
          <span className="text-white/60 text-xs">Humidity</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Wind className="w-5 h-5 text-white/70" />
          <span className="text-white text-sm font-medium">{weather.wind} mph</span>
          <span className="text-white/60 text-xs">Wind</span>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="px-4 py-3 bg-white/20 backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">7-Day Forecast</h3>
        <div className="flex justify-between">
          {forecast.map((day, i) => {
            const Icon = getWeatherIcon(day.conditionCode);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span className="text-xs text-white/70">{i === 0 ? "Today" : day.day}</span>
                <Icon className="w-5 h-5 text-white" />
                <span className="text-xs text-white">{day.high}°</span>
                <span className="text-xs text-white/50">{day.low}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
