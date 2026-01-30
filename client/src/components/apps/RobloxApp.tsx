import { useState } from "react";
import { 
  Home, Gamepad2, Users, ShoppingBag, User, Settings, Search,
  Play, Star, Clock, TrendingUp, Heart, ArrowLeft, X, Volume2,
  Maximize2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
  creator: string;
  playing: number;
  visits: string;
  likes: number;
  category: string;
  description: string;
}

interface UserData {
  id: string;
  firstName: string | null;
  email: string;
}

const MOCK_GAMES: Game[] = [
  {
    id: "1",
    name: "Adopt Me!",
    thumbnail: "linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)",
    creator: "DreamCraft",
    playing: 523847,
    visits: "32.5B",
    likes: 12500000,
    category: "Adventure",
    description: "Raise and dress cute pets, decorate your home, and explore the magical world of Adoption Island!"
  },
  {
    id: "2", 
    name: "Brookhaven RP",
    thumbnail: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    creator: "Wolfpaq",
    playing: 412933,
    visits: "28.1B",
    likes: 9800000,
    category: "Town and City",
    description: "Live your dream life in Brookhaven! Own houses, drive vehicles, and roleplay with friends."
  },
  {
    id: "3",
    name: "Tower of Hell",
    thumbnail: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    creator: "YXCeptional Studios",
    playing: 189234,
    visits: "18.7B",
    likes: 7200000,
    category: "Obby",
    description: "Race to the top of a randomly generated tower! No checkpoints, pure skill."
  },
  {
    id: "4",
    name: "Blox Fruits",
    thumbnail: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    creator: "Gamer Robot Inc",
    playing: 356782,
    visits: "42.3B",
    likes: 11000000,
    category: "Adventure",
    description: "Become a master swordsman or a powerful Blox Fruit user in this One Piece inspired adventure!"
  },
  {
    id: "5",
    name: "Murder Mystery 2",
    thumbnail: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    creator: "Nikilis",
    playing: 145623,
    visits: "8.9B",
    likes: 5400000,
    category: "Horror",
    description: "One murderer, one sheriff, and innocent bystanders. Can you survive?"
  },
  {
    id: "6",
    name: "Jailbreak",
    thumbnail: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    creator: "Badimo",
    playing: 234567,
    visits: "7.2B",
    likes: 6100000,
    category: "Adventure",
    description: "Plan your escape from prison or stop criminals as a police officer!"
  },
  {
    id: "7",
    name: "Arsenal",
    thumbnail: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    creator: "ROLVe Community",
    playing: 98234,
    visits: "5.1B",
    likes: 4200000,
    category: "Fighting",
    description: "Fast-paced FPS action! Get kills to earn new weapons and dominate the battlefield."
  },
  {
    id: "8",
    name: "Pet Simulator X",
    thumbnail: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    creator: "BIG Games",
    playing: 287456,
    visits: "15.8B",
    likes: 8900000,
    category: "Simulator",
    description: "Collect pets, explore worlds, and become the ultimate pet collector!"
  },
  {
    id: "9",
    name: "Piggy",
    thumbnail: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    creator: "MiniToon",
    playing: 76543,
    visits: "11.2B",
    likes: 5800000,
    category: "Horror",
    description: "Escape from Piggy before time runs out! Solve puzzles and survive the horror."
  },
  {
    id: "10",
    name: "Royale High",
    thumbnail: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    creator: "callmehbob",
    playing: 167890,
    visits: "22.4B",
    likes: 7500000,
    category: "Adventure",
    description: "Attend a magical school, dress up in beautiful outfits, and live your royal fantasy!"
  },
  {
    id: "11",
    name: "Doors",
    thumbnail: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)",
    creator: "LSPLASH",
    playing: 123456,
    visits: "4.8B",
    likes: 3200000,
    category: "Horror",
    description: "Enter the hotel and survive 100 doors of terror. Each room holds new horrors."
  },
  {
    id: "12",
    name: "Build A Boat",
    thumbnail: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    creator: "Chillz Studios",
    playing: 89012,
    visits: "3.6B",
    likes: 2800000,
    category: "Building",
    description: "Build a boat and sail to the end! Collect gold and unlock new building materials."
  },
];

const CATEGORIES = [
  "All", "Adventure", "Obby", "Simulator", "Horror", "Fighting", "Town and City", "Building"
];

type Tab = "home" | "discover" | "avatar" | "create" | "robux";

export function RobloxApp() {
  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [robux, setRobux] = useState(1250);
  const [favorites, setFavorites] = useState<string[]>([]);

  const username = user?.firstName || user?.email?.split("@")[0] || "Player";

  const filteredGames = MOCK_GAMES.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  if (isPlaying && selectedGame) {
    return (
      <div className="h-full bg-black flex flex-col" data-testid="roblox-playing">
        <div className="bg-zinc-900 p-2 flex items-center justify-between border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-zinc-700"
              onClick={() => setIsPlaying(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <span className="text-white font-medium">{selectedGame.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-700">
              <Volume2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-700">
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div 
          className="flex-1 flex items-center justify-center"
          style={{ background: selectedGame.thumbnail }}
        >
          <div className="text-center text-white">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Gamepad2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedGame.name}</h2>
            <p className="text-white/70 mb-4">Playing with {formatNumber(selectedGame.playing)} others</p>
            <div className="flex gap-4 justify-center text-sm">
              <div className="bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="font-bold">{selectedGame.visits}</div>
                <div className="text-white/60 text-xs">Visits</div>
              </div>
              <div className="bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="font-bold">{formatNumber(selectedGame.likes)}</div>
                <div className="text-white/60 text-xs">Likes</div>
              </div>
            </div>
            <p className="mt-6 text-white/50 text-sm">
              This is a simulation - actual gameplay requires the Roblox client
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedGame) {
    return (
      <div className="h-full bg-zinc-900 flex flex-col overflow-hidden" data-testid="roblox-game-details">
        <div 
          className="h-48 relative"
          style={{ background: selectedGame.thumbnail }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 left-2 text-white bg-black/30 hover:bg-black/50"
            onClick={() => setSelectedGame(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">{selectedGame.name}</h1>
            <p className="text-white/80 text-sm">By {selectedGame.creator}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => setIsPlaying(true)}
              data-testid="button-play-game"
            >
              <Play className="w-5 h-5" />
              Play
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className={favorites.includes(selectedGame.id) ? "text-red-500 border-red-500" : ""}
              onClick={() => toggleFavorite(selectedGame.id)}
            >
              <Heart className="w-5 h-5" fill={favorites.includes(selectedGame.id) ? "currentColor" : "none"} />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-green-400 font-bold text-lg">{formatNumber(selectedGame.playing)}</div>
              <div className="text-zinc-400 text-xs">Playing</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-white font-bold text-lg">{selectedGame.visits}</div>
              <div className="text-zinc-400 text-xs">Visits</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-white font-bold text-lg">{formatNumber(selectedGame.likes)}</div>
              <div className="text-zinc-400 text-xs">Likes</div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">About</h3>
            <p className="text-zinc-400 text-sm">{selectedGame.description}</p>
            <Badge className="mt-2 bg-zinc-700">{selectedGame.category}</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-900 flex flex-col" data-testid="roblox-app">
      <div className="bg-zinc-800 p-2 flex items-center gap-2 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-white font-bold hidden sm:inline">Roblox</span>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search experiences"
              className="pl-8 bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 h-8"
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="text-yellow-400 hover:bg-zinc-700 gap-1 px-2"
            onClick={() => setActiveTab("robux")}
          >
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-900">R$</span>
            </div>
            <span className="text-sm">{robux.toLocaleString()}</span>
          </Button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{username.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-16 bg-zinc-800 border-r border-zinc-700 flex flex-col items-center py-4 gap-2">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "discover", icon: Gamepad2, label: "Discover" },
            { id: "avatar", icon: User, label: "Avatar" },
            { id: "create", icon: Settings, label: "Create" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === item.id 
                  ? "bg-zinc-600 text-white" 
                  : "text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
              data-testid={`tab-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === "home" && (
            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Continue Playing
                  </h2>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                    See All <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MOCK_GAMES.slice(0, 4).map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onClick={() => setSelectedGame(game)}
                      isFavorite={favorites.includes(game.id)}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Popular Now
                  </h2>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                    See All <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MOCK_GAMES.slice(0, 8).map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onClick={() => setSelectedGame(game)}
                      isFavorite={favorites.includes(game.id)}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Top Rated
                  </h2>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                    See All <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...MOCK_GAMES].sort((a, b) => b.likes - a.likes).slice(0, 4).map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onClick={() => setSelectedGame(game)}
                      isFavorite={favorites.includes(game.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "discover" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    }
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredGames.map(game => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onClick={() => setSelectedGame(game)}
                    isFavorite={favorites.includes(game.id)}
                  />
                ))}
              </div>
              {filteredGames.length === 0 && (
                <div className="text-center text-zinc-400 py-12">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-2" />
                  <p>No experiences found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "avatar" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-6 flex items-center justify-center">
                <User className="w-24 h-24 text-white" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">{username}</h2>
              <p className="text-zinc-400 text-sm mb-6">Customize your avatar</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Wardrobe
                </Button>
                <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                  <Users className="w-4 h-4 mr-2" />
                  Outfits
                </Button>
              </div>
              <div className="mt-8 bg-zinc-800 rounded-lg p-4 w-full max-w-sm">
                <h3 className="text-white font-medium mb-3">Recent Items</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square bg-zinc-700 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "create" && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-6 flex items-center justify-center">
                <Settings className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Create Experiences</h2>
              <p className="text-zinc-400 max-w-md mb-6">
                Build your own games and experiences! Use Roblox Studio to create amazing worlds 
                and share them with millions of players.
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Open Roblox Studio
              </Button>
            </div>
          )}

          {activeTab === "robux" && (
            <div className="max-w-md mx-auto py-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-900">R$</span>
                </div>
                <h2 className="text-white text-2xl font-bold">{robux.toLocaleString()}</h2>
                <p className="text-zinc-400">Robux Balance</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-white font-medium">Buy Robux</h3>
                {[
                  { amount: 400, price: "$4.99", bonus: "" },
                  { amount: 800, price: "$9.99", bonus: "" },
                  { amount: 1700, price: "$19.99", bonus: "+100 Bonus" },
                  { amount: 4500, price: "$49.99", bonus: "+450 Bonus" },
                  { amount: 10000, price: "$99.99", bonus: "+1000 Bonus" },
                ].map(tier => (
                  <button
                    key={tier.amount}
                    onClick={() => setRobux(prev => prev + tier.amount)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 flex items-center justify-between transition-colors"
                    data-testid={`robux-${tier.amount}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-zinc-900">R$</span>
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium">{tier.amount.toLocaleString()} Robux</div>
                        {tier.bonus && <div className="text-green-400 text-xs">{tier.bonus}</div>}
                      </div>
                    </div>
                    <div className="text-yellow-400 font-bold">{tier.price}</div>
                  </button>
                ))}
              </div>
              <p className="text-zinc-500 text-xs text-center mt-4">
                This is a simulation - no real purchases are made
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function GameCard({ game, onClick, isFavorite }: { game: Game; onClick: () => void; isFavorite: boolean }) {
  const formatPlaying = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <button
      onClick={onClick}
      className="group text-left bg-zinc-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
      data-testid={`game-card-${game.id}`}
    >
      <div 
        className="aspect-video relative"
        style={{ background: game.thumbnail }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white" />
        </div>
        {isFavorite && (
          <div className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" fill="currentColor" />
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-white text-sm font-medium truncate">{game.name}</h3>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span>{formatPlaying(game.playing)} playing</span>
        </div>
      </div>
    </button>
  );
}
