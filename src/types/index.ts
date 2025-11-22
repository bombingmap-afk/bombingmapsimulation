export interface Bomb {
  id: string;
  square_id: string;
  country: string;
  message: string;
  created_at: string;
}

export interface Square {
  id: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  location?: string;
  bomb_count: number;
  bombs: Bomb[];
}

export interface UserSession {
  id: string;
  last_bomb_date: string | null;
}