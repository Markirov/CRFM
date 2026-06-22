import dict from './i18n-es.json';

// Tipo de los diccionarios
type DictMap = Record<string, string>;

const weaponsDict = dict.weapons as DictMap;
const ammoDict = dict.ammo as DictMap;
const equipmentDict = dict.equipment as DictMap;
const personalDict = dict.personal as DictMap;

/**
 * Traduce un nombre de equipo personal (barracones)
 */
export function tPersonal(name: string): string {
  if (!name) return name;
  return personalDict[name] || name;
}

/**
 * Traduce nombres de equipo/armamento de los Mechs/Vehículos (Simulador/Hangar).
 * Preserva prefijos como (IS), (CL), (R), etc.
 * 
 * Ej: "(IS) Medium Laser" -> "(IS) Láser Medio"
 * Ej: "Ammo (LRM 20)" -> "Munición (AMLA 20)"
 */
export function tWeapon(name: string): string {
  if (!name) return name;

  // Si es un nombre exacto del diccionario de equipos o armas, lo devolvemos
  if (weaponsDict[name]) return weaponsDict[name];
  if (equipmentDict[name]) return equipmentDict[name];

  let result = name;

  // 1. Extraer prefijos como (IS), (CL), (T), (R), (F) y guardarlos
  const prefixMatch = result.match(/^(\([A-Z]+\)\s*)+/);
  let prefix = '';
  if (prefixMatch) {
    prefix = prefixMatch[0];
    result = result.substring(prefix.length).trim();
  }

  // 2. Comprobar si es Munición "Ammo (...)"
  if (result.startsWith('Ammo (')) {
    let inner = result.substring(6, result.length - 1);
    
    // Traducir interior de la munición (ej: "LRM 20" -> "AMLA 20", "AC/20" -> "CA/20")
    const wKeys = Object.keys(weaponsDict).sort((a, b) => b.length - a.length);
    for (const en of wKeys) {
      const regex = new RegExp(en, 'gi');
      if (regex.test(inner)) {
        inner = inner.replace(regex, weaponsDict[en]);
        break; // Reemplazar solo el primero más grande
      }
    }
    // Traducir términos específicos de munición
    for (const [en, es] of Object.entries(ammoDict)) {
      inner = inner.replace(new RegExp(en, 'g'), es);
    }
    return `${prefix}Munición (${inner})`;
  }

  // 3. Traducir armamento (reemplazo inteligente para cosas como "LRM-20")
  let translatedCore = result;

  // Mapeos exactos primero
  if (weaponsDict[result]) {
    translatedCore = weaponsDict[result];
  } else if (equipmentDict[result]) {
    translatedCore = equipmentDict[result];
  } else {
    // Si no es un mapeo exacto, buscar reemplazos parciales (ej "LRM 20", "ER PPC")
    // Ordenamos las keys por longitud para que "ER Medium Laser" se traduzca antes que "Medium Laser"
    const keys = Object.keys(weaponsDict).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      const regex = new RegExp(key, 'gi');
      if (regex.test(translatedCore)) {
        translatedCore = translatedCore.replace(regex, weaponsDict[key]);
        break; 
      }
    }
  }

  return prefix + translatedCore;
}
