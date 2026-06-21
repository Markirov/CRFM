export interface AlmacenCatalogItem {
  nombre: string;
  tipo: 'arma' | 'municion' | 'equipo' | 'blindaje';
  tons?: number;
  costoBase: number; // Coste en C-Bills (normalmente por unidad, o por tonelada)
  yield?: number; // Para munición: misiles/rondas por tonelada. Para blindaje: puntos por tonelada.
}

export const ALMACEN_CATALOG: AlmacenCatalogItem[] = [
  // --- ENERGIA ---
  { nombre: 'Small Laser', tipo: 'arma', tons: 0.5, costoBase: 11250 },
  { nombre: 'Medium Laser', tipo: 'arma', tons: 1.0, costoBase: 40000 },
  { nombre: 'Large Laser', tipo: 'arma', tons: 5.0, costoBase: 100000 },
  { nombre: 'PPC', tipo: 'arma', tons: 7.0, costoBase: 200000 },
  { nombre: 'ER PPC', tipo: 'arma', tons: 7.0, costoBase: 300000 },
  { nombre: 'ER Large Laser', tipo: 'arma', tons: 5.0, costoBase: 200000 },
  { nombre: 'ER Medium Laser', tipo: 'arma', tons: 1.0, costoBase: 80000 },
  { nombre: 'ER Small Laser', tipo: 'arma', tons: 0.5, costoBase: 22500 },
  { nombre: 'Medium Pulse Laser', tipo: 'arma', tons: 2.0, costoBase: 60000 },
  { nombre: 'Large Pulse Laser', tipo: 'arma', tons: 7.0, costoBase: 175000 },

  // --- MISILES ---
  { nombre: 'LRM 5', tipo: 'arma', tons: 2.0, costoBase: 30000 },
  { nombre: 'LRM 10', tipo: 'arma', tons: 5.0, costoBase: 100000 },
  { nombre: 'LRM 15', tipo: 'arma', tons: 7.0, costoBase: 175000 },
  { nombre: 'LRM 20', tipo: 'arma', tons: 10.0, costoBase: 250000 },
  { nombre: 'SRM 2', tipo: 'arma', tons: 1.0, costoBase: 10000 },
  { nombre: 'SRM 4', tipo: 'arma', tons: 2.0, costoBase: 60000 },
  { nombre: 'SRM 6', tipo: 'arma', tons: 3.0, costoBase: 80000 },
  { nombre: 'Streak SRM 2', tipo: 'arma', tons: 1.5, costoBase: 15000 },
  { nombre: 'Streak SRM 4', tipo: 'arma', tons: 3.0, costoBase: 90000 },
  { nombre: 'Streak SRM 6', tipo: 'arma', tons: 4.5, costoBase: 120000 },

  // --- BALISTICA ---
  { nombre: 'Machine Gun', tipo: 'arma', tons: 0.5, costoBase: 5000 },
  { nombre: 'AC/2', tipo: 'arma', tons: 6.0, costoBase: 75000 },
  { nombre: 'AC/5', tipo: 'arma', tons: 8.0, costoBase: 125000 },
  { nombre: 'AC/10', tipo: 'arma', tons: 12.0, costoBase: 200000 },
  { nombre: 'AC/20', tipo: 'arma', tons: 14.0, costoBase: 300000 },
  { nombre: 'UAC/5', tipo: 'arma', tons: 9.0, costoBase: 200000 },
  { nombre: 'LB 10-X AC', tipo: 'arma', tons: 11.0, costoBase: 400000 },
  { nombre: 'Gauss Rifle', tipo: 'arma', tons: 15.0, costoBase: 300000 },

  // --- EQUIPO ---
  { nombre: 'Heat Sink', tipo: 'equipo', tons: 1.0, costoBase: 2000 },
  { nombre: 'Double Heat Sink', tipo: 'equipo', tons: 1.0, costoBase: 6000 },
  { nombre: 'Jump Jet', tipo: 'equipo', tons: 0.5, costoBase: 200 }, // El coste es variable por tonelaje, ponemos base mínimo
  { nombre: 'Anti-Missile System', tipo: 'equipo', tons: 0.5, costoBase: 100000 },
  { nombre: 'Guardian ECM Suite', tipo: 'equipo', tons: 1.5, costoBase: 200000 },
  { nombre: 'Beagle Active Probe', tipo: 'equipo', tons: 1.5, costoBase: 200000 },

  // --- MUNICION (comprada por tonelada) ---
  { nombre: 'Ammo (LRM)', tipo: 'municion', tons: 1.0, costoBase: 30000, yield: 120 },
  { nombre: 'Ammo (SRM)', tipo: 'municion', tons: 1.0, costoBase: 27000, yield: 100 },
  { nombre: 'Ammo (Streak SRM 2)', tipo: 'municion', tons: 1.0, costoBase: 27000, yield: 50 },
  { nombre: 'Ammo (Streak SRM 4)', tipo: 'municion', tons: 1.0, costoBase: 54000, yield: 50 }, // Aprox
  { nombre: 'Ammo (MG)', tipo: 'municion', tons: 1.0, costoBase: 1000, yield: 200 },
  { nombre: 'Ammo (AC/2)', tipo: 'municion', tons: 1.0, costoBase: 1000, yield: 45 },
  { nombre: 'Ammo (AC/5)', tipo: 'municion', tons: 1.0, costoBase: 4500, yield: 20 },
  { nombre: 'Ammo (AC/10)', tipo: 'municion', tons: 1.0, costoBase: 6000, yield: 10 },
  { nombre: 'Ammo (AC/20)', tipo: 'municion', tons: 1.0, costoBase: 10000, yield: 5 },
  { nombre: 'Ammo (UAC/5)', tipo: 'municion', tons: 1.0, costoBase: 9000, yield: 20 },
  { nombre: 'Ammo (LB 10-X)', tipo: 'municion', tons: 1.0, costoBase: 12000, yield: 10 },
  { nombre: 'Ammo (Gauss)', tipo: 'municion', tons: 1.0, costoBase: 20000, yield: 8 },
  { nombre: 'Ammo (AMS)', tipo: 'municion', tons: 1.0, costoBase: 2000, yield: 12 },

  // --- BLINDAJE (comprado por tonelada) ---
  { nombre: 'Armor (Standard)', tipo: 'blindaje', tons: 1.0, costoBase: 10000, yield: 16 },
  { nombre: 'Armor (Ferro-Fibrous)', tipo: 'blindaje', tons: 1.0, costoBase: 20000, yield: 18 },
  { nombre: 'Armor (Stealth)', tipo: 'blindaje', tons: 1.0, costoBase: 50000, yield: 16 },
];
