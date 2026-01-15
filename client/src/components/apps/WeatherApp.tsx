import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, Search } from "lucide-react";

interface WeatherData {
  city: string;
  temp: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy";
  humidity: number;
  wind: number;
  feelsLike: number;
  high: number;
  low: number;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy";
}

const weatherIcons: Record<string, React.ComponentType<any>> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
};

const mockWeatherData: Record<string, WeatherData> = {
  "new york": { city: "New York", temp: 72, condition: "sunny", humidity: 65, wind: 8, feelsLike: 74, high: 78, low: 65 },
  "london": { city: "London", temp: 58, condition: "cloudy", humidity: 78, wind: 12, feelsLike: 55, high: 62, low: 52 },
  "tokyo": { city: "Tokyo", temp: 68, condition: "rainy", humidity: 85, wind: 5, feelsLike: 70, high: 72, low: 64 },
  "paris": { city: "Paris", temp: 63, condition: "cloudy", humidity: 70, wind: 10, feelsLike: 61, high: 68, low: 58 },
  "sydney": { city: "Sydney", temp: 82, condition: "sunny", humidity: 55, wind: 15, feelsLike: 85, high: 88, low: 75 },
};

const mockForecast: ForecastDay[] = [
  { day: "Mon", high: 78, low: 65, condition: "sunny" },
  { day: "Tue", high: 75, low: 62, condition: "cloudy" },
  { day: "Wed", high: 72, low: 60, condition: "rainy" },
  { day: "Thu", high: 70, low: 58, condition: "rainy" },
  { day: "Fri", high: 74, low: 61, condition: "cloudy" },
  { day: "Sat", high: 79, low: 66, condition: "sunny" },
  { day: "Sun", high: 81, low: 68, condition: "sunny" },
];

export function WeatherApp() {
  const [searchCity, setSearchCity] = useState("");
  const [weather, setWeather] = useState<WeatherData>(mockWeatherData["new york"]);
  const [forecast] = useState<ForecastDay[]>(mockForecast);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cityData = mockWeatherData[searchCity.toLowerCase()];
    if (cityData) {
      setWeather(cityData);
    }
    setSearchCity("");
  };

  const WeatherIcon = weatherIcons[weather.condition];

  const getBackgroundGradient = () => {
    switch (weather.condition) {
      case "sunny": return "from-orange-400 via-yellow-300 to-blue-400";
      case "cloudy": return "from-gray-400 via-gray-300 to-blue-300";
      case "rainy": return "from-gray-600 via-blue-400 to-gray-500";
      case "snowy": return "from-blue-200 via-white to-gray-200";
      default: return "from-blue-400 to-blue-600";
    }
  };

  return (
    <div className={`h-full flex flex-col bg-gradient-to-br ${getBackgroundGradient()}`}>
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
            <Search className="w-4 h-4 text-white/60" />
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
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-white/10 backdrop-blur-sm">
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
        <div className="flex flex-col items-center gap-1">
          <Sun className="w-5 h-5 text-white/70" />
          <span className="text-white text-sm font-medium">6:32 AM</span>
          <span className="text-white/60 text-xs">Sunrise</span>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="px-4 py-3 bg-white/20 backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">7-Day Forecast</h3>
        <div className="flex justify-between">
          {forecast.map(day => {
            const Icon = weatherIcons[day.condition];
            return (
              <div key={day.day} className="flex flex-col items-center gap-1">
                <span className="text-xs text-white/70">{day.day}</span>
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
