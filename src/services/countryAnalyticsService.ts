import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface HourlyData {
  hour: number;
  count: number;
}

interface DailyData {
  date: string;
  count: number;
}

export const getCountryAnalytics = async (country: string): Promise<{
  hourlyData: HourlyData[];
  dailyData: DailyData[];
}> => {
  try {
    // Get data for the last 30 days for this specific country
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'bombs'),
      where('country', '==', country),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Initialize hourly data (0-23 hours) for last 24 hours only
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }
    
    // Initialize daily data (last 30 days)
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyMap.set(dateString, 0);
    }
    
    // Process bomb data
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp.toDate();
      
      // Count by hour (only last 24 hours)
      if (date >= twentyFourHoursAgo) {
        const hour = date.getHours();
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      }
      
      // Count by day (last 30 days)
      const dateString = date.toISOString().split('T')[0];
      if (dailyMap.has(dateString)) {
        dailyMap.set(dateString, (dailyMap.get(dateString) || 0) + 1);
      }
    });
    
    // Convert to arrays
    const hourlyData: HourlyData[] = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);
    
    const dailyData: DailyData[] = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return { hourlyData, dailyData };
  } catch (error) {
    console.error('Error getting country analytics:', error);
    return { hourlyData: [], dailyData: [] };
  }
};