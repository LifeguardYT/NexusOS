import { type User, type InsertUser, type Settings, settingsSchema } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSettings(userId: string): Promise<Settings>;
  updateSettings(userId: string, settings: Partial<Settings>): Promise<Settings>;
}

const defaultSettings: Settings = {
  wallpaper: "gradient-1",
  theme: "dark",
  accentColor: "blue",
  fontSize: "medium",
  showDesktopIcons: true,
  taskbarPosition: "bottom",
  volume: 50,
  brightness: 100,
  notifications: true,
  wifi: true,
  bluetooth: false,
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private settings: Map<string, Settings>;

  constructor() {
    this.users = new Map();
    this.settings = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSettings(userId: string): Promise<Settings> {
    const userSettings = this.settings.get(userId);
    if (!userSettings) {
      this.settings.set(userId, { ...defaultSettings });
      return { ...defaultSettings };
    }
    return userSettings;
  }

  async updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings(userId);
    const newSettings = { ...currentSettings, ...updates };
    const validated = settingsSchema.parse(newSettings);
    this.settings.set(userId, validated);
    return validated;
  }
}

export const storage = new MemStorage();
