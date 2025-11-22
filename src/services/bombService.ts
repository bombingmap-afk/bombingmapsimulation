import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';

import { db } from '../config/firebase';

export interface BombData {
  id?: string;
  country: string;
  message: string;
  timestamp: Timestamp;
  gifUrl?: string;
  source?:string;
}

export interface CountryBombCount {
  country: string;
  count: number;
}

// Get today's date range for queries
const getTodayRange = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return {
    start: Timestamp.fromDate(startOfDay),
    end: Timestamp.fromDate(endOfDay)
  };
};

// Listen to today's bombs for a specific country in real-time
export const listenToCountryBombs = (
  country: string, 
  callback: (bombs: BombData[]) => void
): (() => void) => {
  const { start, end } = getTodayRange();
  
  const q = query(
    collection(db, 'bombs'),
    where('country', '==', country),
    where('timestamp', '>=', start),
    where('timestamp', '<', end),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const bombs: BombData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BombData));
    callback(bombs);
  });
};

// Listen to all today's bombs for real-time map updates
export const listenToAllTodaysBombs = (
  callback: (bombCounts: Map<string, number>) => void
): (() => void) => {
  const { start, end } = getTodayRange();
  
  const q = query(
    collection(db, 'bombs'),
    where('timestamp', '>=', start),
    where('timestamp', '<', end)
  );

  return onSnapshot(q, (snapshot) => {
    const bombCounts = new Map<string, number>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const country = data.country;
      bombCounts.set(country, (bombCounts.get(country) || 0) + 1);
    });
    
    callback(bombCounts);
  });
};

// Get total bombs count for today
export const getTotalBombsToday = async (): Promise<number> => {
  try {
    const { start, end } = getTodayRange();
    
    const q = query(
      collection(db, 'bombs'),
      where('timestamp', '>=', start),
      where('timestamp', '<', end)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting total bombs:', error);
    return 0;
  }
};

// Get rankings for a specific date
export const getRankingsForDate = async (date: string): Promise<Array<{country: string, bombCount: number, rank: number}>> => {
  try {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const q = query(
      collection(db, 'bombs'),
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<', Timestamp.fromDate(endOfDay))
    );
    
    const snapshot = await getDocs(q);
    const bombCounts = new Map<string, number>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const country = data.country;
      bombCounts.set(country, (bombCounts.get(country) || 0) + 1);
    });
    
    // Convert to array and sort by bomb count
    const rankings = Array.from(bombCounts.entries())
      .map(([country, bombCount]) => ({ country, bombCount }))
      .sort((a, b) => b.bombCount - a.bombCount)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    
    return rankings;
  } catch (error) {
    console.error('Error getting rankings:', error);
    return [];
  }
};

// Get trending data (compare today vs yesterday)
export const getTrendingData = async (): Promise<Array<{
  country: string, 
  todayRank: number, 
  yesterdayRank: number, 
  change: number,
  bombCount: number
}>> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [todayRankings, yesterdayRankings] = await Promise.all([
      getRankingsForDate(today),
      getRankingsForDate(yesterday)
    ]);
    
    // Create maps for quick lookup
    const yesterdayMap = new Map(yesterdayRankings.map(r => [r.country, r.rank]));
    
    // Calculate trends
    const trending = todayRankings.map(today => {
      const yesterdayRank = yesterdayMap.get(today.country) || (yesterdayRankings.length + 1); // New countries get rank after last
      const change = yesterdayRank - today.rank; // Positive = moved up, negative = moved down
      
      return {
        country: today.country,
        todayRank: today.rank,
        yesterdayRank,
        change,
        bombCount: today.bombCount
      };
    });
    
    return trending;
  } catch (error) {
    console.error('Error getting trending data:', error);
    return [];
  }
};

// Get available dates that have bomb data
export const getAvailableDates = async (): Promise<string[]> => {
  try {
    // Get all bombs and extract unique dates
    const q = query(collection(db, 'bombs'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    const dates = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp.toDate().toISOString().split('T')[0];
      dates.add(date);
    });
    
    // Convert to array and sort (most recent first)
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.error('Error getting available dates:', error);
    return [new Date().toISOString().split('T')[0]]; // Return today as fallback
  }
};