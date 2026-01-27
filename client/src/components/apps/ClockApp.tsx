import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Globe } from "lucide-react";

interface WorldClock {
  id: string;
  timezone: string;
  city: string;
}

const POPULAR_TIMEZONES = [
  { timezone: "America/New_York", city: "New York" },
  { timezone: "America/Los_Angeles", city: "Los Angeles" },
  { timezone: "America/Chicago", city: "Chicago" },
  { timezone: "Europe/London", city: "London" },
  { timezone: "Europe/Paris", city: "Paris" },
  { timezone: "Europe/Berlin", city: "Berlin" },
  { timezone: "Asia/Tokyo", city: "Tokyo" },
  { timezone: "Asia/Shanghai", city: "Shanghai" },
  { timezone: "Asia/Dubai", city: "Dubai" },
  { timezone: "Asia/Singapore", city: "Singapore" },
  { timezone: "Australia/Sydney", city: "Sydney" },
  { timezone: "Pacific/Auckland", city: "Auckland" },
];

export function ClockApp() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>(() => {
    const saved = localStorage.getItem("worldclocks");
    return saved ? JSON.parse(saved) : [
      { id: "1", timezone: "America/New_York", city: "New York" },
      { id: "2", timezone: "Europe/London", city: "London" },
      { id: "3", timezone: "Asia/Tokyo", city: "Tokyo" },
    ];
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("worldclocks", JSON.stringify(worldClocks));
  }, [worldClocks]);

  const getTimeInTimezone = (timezone: string) => {
    try {
      return currentTime.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "--:--:--";
    }
  };

  const getDateInTimezone = (timezone: string) => {
    try {
      return currentTime.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const addClock = (timezone: string, city: string) => {
    const exists = worldClocks.some(c => c.timezone === timezone);
    if (exists) return;
    
    setWorldClocks(prev => [...prev, {
      id: Date.now().toString(),
      timezone,
      city,
    }]);
    setShowAddDialog(false);
    setSearchQuery("");
  };

  const removeClock = (id: string) => {
    setWorldClocks(prev => prev.filter(c => c.id !== id));
  };

  const filteredTimezones = POPULAR_TIMEZONES.filter(tz =>
    tz.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.timezone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localCity = localTimezone.split("/").pop()?.replace(/_/g, " ") || "Local";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 p-6" data-testid="clock-app">
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-white mb-2">
          {currentTime.toLocaleTimeString("en-US", { hour12: true })}
        </div>
        <div className="text-xl text-gray-400">
          {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div className="text-sm text-gray-500 mt-1">{localCity}</div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          World Clocks
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} data-testid="button-add-clock">
          <Plus className="w-4 h-4 mr-1" />
          Add Clock
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {worldClocks.map(clock => (
          <div
            key={clock.id}
            className="bg-white/5 rounded-lg p-4 flex items-center justify-between group"
            data-testid={`clock-${clock.id}`}
          >
            <div>
              <div className="text-lg font-semibold text-white">{clock.city}</div>
              <div className="text-sm text-gray-400">{getDateInTimezone(clock.timezone)}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono text-white">
                {getTimeInTimezone(clock.timezone)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                onClick={() => removeClock(clock.id)}
                data-testid={`button-remove-${clock.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add World Clock</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cities..."
              className="mb-4"
              data-testid="input-search-city"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredTimezones.map(tz => {
                const isAdded = worldClocks.some(c => c.timezone === tz.timezone);
                return (
                  <button
                    key={tz.timezone}
                    onClick={() => !isAdded && addClock(tz.timezone, tz.city)}
                    disabled={isAdded}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isAdded
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700/50 hover:bg-gray-700 text-white"
                    }`}
                    data-testid={`timezone-${tz.timezone}`}
                  >
                    <div className="font-medium">{tz.city}</div>
                    <div className="text-sm text-gray-400">{getTimeInTimezone(tz.timezone)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
