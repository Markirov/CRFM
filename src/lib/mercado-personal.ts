export interface MercadoItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'Equipo' | 'Armas' | 'Vestimenta' | 'Médico' | 'Implantes' | 'Otro';
  introYear?: number;
  peso?: number; // En kilogramos
  faccion?: 'General' | 'Esfera Interior' | 'Clanes' | 'Liga Estelar';
  volumen?: 'Bolsillo' | 'Funda/Cabina' | 'Dos Manos' | 'Pesado/Mochila';
}

export const MERCADO_PERSONAL: MercadoItem[] = [
  {
    "id": "ablative-flak-body-suit",
    "nombre": "Ablative/Flak Body Suit",
    "descripcion": "Absorbe un total de 35 puntos de daño y reduce a la mitad el daño de armas de proyectiles y energía. Reduce el movimiento del portador a la mitad.",
    "precio": 800,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "ablative-flak-vest",
    "nombre": "Ablative/Flak Vest",
    "descripcion": "Absorbe un total de 10 puntos de daño y reduce a la mitad el daño de armas de proyectiles y energía hasta que se agota su protección.",
    "precio": 300,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "ametralladora-b",
    "nombre": "Ametralladora (B)",
    "descripcion": "Puede atacar hasta a dos objetivos diferentes por Narración.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "archaic-sword",
    "nombre": "Archaic Sword",
    "descripcion": "–1 TO ATTACK ROLL",
    "precio": 45,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 3.5,
    "faccion": "General"
  },
  {
    "id": "arco-compuesto",
    "nombre": "Arco Compuesto",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "armadura-ablativa",
    "nombre": "Armadura Ablativa",
    "descripcion": "-2 de daño de armas de energía (E).",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "armadura-antimetralla-flak",
    "nombre": "Armadura Antimetralla (Flak)",
    "descripcion": "-2 de daño de armas balísticas (B).",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "armored-vest",
    "nombre": "Armored Vest",
    "descripcion": "Chaleco antibalas estándar, ofrece protección básica.",
    "precio": 50,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "artes-marciales",
    "nombre": "Artes Marciales",
    "descripcion": "No cuenta para el límite de armas.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "auto-pistol",
    "nombre": "Auto Pistol",
    "descripcion": "Versión automática de la pistola estándar con mayor capacidad de munición.",
    "precio": 40,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "auto-pistol-magnum",
    "nombre": "Auto-Pistol (Magnum)",
    "descripcion": "-1 to Attack Roll. Jams on Fumble.",
    "precio": 75,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 0.5,
    "faccion": "General"
  },
  {
    "id": "automatic-shotgun",
    "nombre": "Automatic Shotgun",
    "descripcion": "Burst (5/1); Splash damage.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "botiqu-n-m-dico",
    "nombre": "Botiquín Médico",
    "descripcion": "Objeto narrativo sin estadísticas definidas.",
    "precio": 0,
    "categoria": "Médico",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "carga-de-demolici-n-c8",
    "nombre": "Carga de Demolición C8",
    "descripcion": "12 de daño (Combate Personal, puede atacar hasta a tres objetivos), 1 de daño (Combate a Escala de 'Mech).",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "clan-elemental",
    "nombre": "Clan Elemental",
    "descripcion": "Standard heavy battle armor of the Clans. Features a modular weapon mount, an anti-personnel weapon, and a detachable SRM-2 pack. Jump capable.",
    "precio": 500000,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "faccion": "Clanes"
  },
  {
    "id": "clans-generic-suit",
    "nombre": "Clans (Generic) Suit",
    "descripcion": "Sin descripción.",
    "precio": 4000,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "peso": 6,
    "faccion": "Clanes"
  },
  {
    "id": "combat-helmet",
    "nombre": "Combat Helmet",
    "descripcion": "+2 to Perception TNs",
    "precio": 200,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 2,
    "faccion": "General"
  },
  {
    "id": "comunicador-personal",
    "nombre": "Comunicador Personal",
    "descripcion": "Objeto narrativo sin estadísticas definidas.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "crossbow-heavy",
    "nombre": "Crossbow, Heavy",
    "descripcion": "Simple Action to Reload",
    "precio": 10,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 4,
    "faccion": "General"
  },
  {
    "id": "cudgel-blackjack",
    "nombre": "Cudgel/Blackjack",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "dagger-knife",
    "nombre": "Dagger/Knife",
    "descripcion": "Arma blanca básica.",
    "precio": 2,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "dest-infiltration-suit",
    "nombre": "DEST Infiltration Suit",
    "descripcion": "Combined IR sneak suit and camouflage clothing. Power use: 1/15 mins.",
    "precio": 50000,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "electronic-camouflage-suit-camo-sneak",
    "nombre": "Electronic Camouflage Suit (Camo Sneak)",
    "descripcion": "Adapta su color y emisión de luz al entorno para evitar la detección visual y electrónica. Otorga un modificador de -3 a las tiradas de la habilidad Stealth.",
    "precio": 7000,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "elemental-battle-armor",
    "nombre": "Elemental Battle Armor",
    "descripcion": "Encumbering; see Battle Armor (p. 141)",
    "precio": 500000,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "emergency-jetpack",
    "nombre": "Emergency Jetpack",
    "descripcion": "Mochila propulsora de un solo uso para escape o movimientos rápidos. Altitud máxima de 30 metros, distancia máxima de 1 kilómetro.",
    "precio": 5000,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "estimulante-stimpatch",
    "nombre": "Estimulante (Stimpatch)",
    "descripcion": "Objeto narrativo sin estadísticas definidas.",
    "precio": 0,
    "categoria": "Médico",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "federated-long-rifle",
    "nombre": "Federated Long Rifle",
    "descripcion": "Sin descripción.",
    "precio": 200,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 3,
    "faccion": "General"
  },
  {
    "id": "field-surgery-kit",
    "nombre": "Field Surgery Kit",
    "descripcion": "Contiene dos escalpelos láser y equipo de soporte quirúrgico para cuidados médicos de Nivel 3.",
    "precio": 0,
    "categoria": "Médico",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "flak-armor-suit",
    "nombre": "Flak Armor (Suit)",
    "descripcion": "Sin descripción.",
    "precio": 100,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 3.5,
    "faccion": "General"
  },
  {
    "id": "flak-armor-vest",
    "nombre": "Flak Armor (Vest)",
    "descripcion": "Sin descripción.",
    "precio": 50,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "peso": 2.8,
    "faccion": "General"
  },
  {
    "id": "flak-vest",
    "nombre": "Flak Vest",
    "descripcion": "Reduce a la mitad el daño de armas de proyectil y arcos. Detiene 2 puntos de daño de armas de energía. Protege torso y brazos. Se vuelve inútil tras absorber 25 puntos de daño.",
    "precio": 50,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "flash-bang-class-a",
    "nombre": "Flash-Bang, Class A",
    "descripcion": "–2 BD VS ANTI-FLASH BAR HIGHER THAN AP",
    "precio": 12,
    "categoria": "Equipo",
    "introYear": 2000,
    "peso": 0.2,
    "faccion": "General"
  },
  {
    "id": "frag-grenade",
    "nombre": "Frag Grenade",
    "descripcion": "Indirect; blast",
    "precio": 20,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 0.6,
    "faccion": "General"
  },
  {
    "id": "gauss-rifle-thunderstroke",
    "nombre": "Gauss Rifle (Thunderstroke)",
    "descripcion": "Encumbering. Gauss weapons also require power packs.",
    "precio": 2500,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 7,
    "faccion": "Esfera Interior"
  },
  {
    "id": "granada-de-mano",
    "nombre": "Granada de Mano",
    "descripcion": "Granada de Alto Explosivo: 8 de daño. Granada Antipersonal: 10 de daño. Puede atacar hasta a tres objetivos diferentes.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "grand-mauler-gauss-cannon",
    "nombre": "Grand Mauler Gauss Cannon",
    "descripcion": "Encumbering. Uses Power Packs.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "grenade",
    "nombre": "Grenade",
    "descripcion": "Indirect. AP/BD depends on ordnance type.",
    "precio": 20,
    "categoria": "Equipo",
    "introYear": 2000,
    "peso": 0.6,
    "faccion": "General"
  },
  {
    "id": "gungnir-heavy-support-gauss-rifle",
    "nombre": "Gungnir Heavy Support Gauss Rifle",
    "descripcion": "CREW: 3; RECHARGE: 1 TURN",
    "precio": 15000,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 60,
    "faccion": "Esfera Interior"
  },
  {
    "id": "hacha",
    "nombre": "Hacha",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "heavy-environment-suit",
    "nombre": "Heavy Environment Suit",
    "descripcion": "Proporciona protección ambiental y de combate. Reduce a la mitad la capacidad de movimiento (MP) del portador. Impone un penalizador de -4 a las tiradas de salvación contra armas aturdidoras y de tranquilizantes.",
    "precio": 10000,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "imperator-rm-3-xi-smg",
    "nombre": "Imperator RM-3/XI SMG",
    "descripcion": "Burst (10/2); jam on a fumble",
    "precio": 80,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 3,
    "faccion": "General"
  },
  {
    "id": "infiltrator-mk-ii",
    "nombre": "Infiltrator Mk. II",
    "descripcion": "Advanced stealth suit with integral IR and electronic signal suppression systems (ECM: 6, IR: 6). Mounts one primary weapon (Magshot Gauss Rifle) and one secondary. Jump capable.",
    "precio": 514000,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "inner-sphere-battle-armor",
    "nombre": "Inner Sphere Battle Armor",
    "descripcion": "see Battle Armor (p. 141)",
    "precio": 400000,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "inner-sphere-standard",
    "nombre": "Inner Sphere Standard",
    "descripcion": "Inner Sphere copy of Clan Elemental armor. Can carry one primary and one secondary weapon, but cannot mount an SRM-2 pack. Jump capable.",
    "precio": 400000,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "intek-laser-rifle",
    "nombre": "Intek Laser Rifle",
    "descripcion": "Uses Power Packs.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "kanazuchi-assault",
    "nombre": "Kanazuchi Assault",
    "descripcion": "Heavy assault suit with impressive armor and firepower. Features two back-mounted SRM-2 launchers, a Mech-sized medium laser, and a pair of torso-mounted SMGs. Limited mobility.",
    "precio": 550000,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "kit-de-demolici-n",
    "nombre": "Kit de Demolición",
    "descripcion": "Objeto narrativo sin estadísticas definidas.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "kit-de-ganz-as",
    "nombre": "Kit de Ganzúas",
    "descripcion": "Objeto narrativo sin estadísticas definidas.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "lanza",
    "nombre": "Lanza",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "lanzador-de-cohetes-law",
    "nombre": "Lanzador de Cohetes (LAW)",
    "descripcion": "Un solo uso. Puede atacar hasta a tres objetivos diferentes por Narración.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "law-light-anti-vehicle-weapon",
    "nombre": "LAW (Light Anti-Vehicle Weapon)",
    "descripcion": "Arma de un solo uso diseñada contra vehículos ligeros.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "longbow",
    "nombre": "Longbow",
    "descripcion": "Simple Action to Reload",
    "precio": 20,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 1.5,
    "faccion": "General"
  },
  {
    "id": "lrm-launcher",
    "nombre": "LRM Launcher",
    "descripcion": "Encumbering. AP/BD depends on ordnance type. *Per ordnance type.",
    "precio": 2000,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 30,
    "faccion": "General"
  },
  {
    "id": "machine-gun-support",
    "nombre": "Machine Gun, Support",
    "descripcion": "Burst 20; Recoil: -2; Crew: 2",
    "precio": 1750,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 44,
    "faccion": "General"
  },
  {
    "id": "magpulse-harpoon-gun",
    "nombre": "Magpulse Harpoon Gun",
    "descripcion": "CREW: 2; –1 TO ATTACK ROLL; SEE SPECIAL GAME RULES",
    "precio": 12000,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 95,
    "faccion": "Esfera Interior"
  },
  {
    "id": "man-pack-flamer",
    "nombre": "Man-Pack Flamer",
    "descripcion": "Splash; incendiary",
    "precio": 100,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 15,
    "faccion": "General"
  },
  {
    "id": "mauser-960-assault-system",
    "nombre": "Mauser 960 Assault System",
    "descripcion": "Pulse Laser. Burst (10/4). Uses Power Packs.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "medipack",
    "nombre": "Medipack",
    "descripcion": "Dispositivo avanzado que administra automáticamente analgésicos y estimulantes. Contiene 12 dosis. Estándar para los Elementales de los Clanes.",
    "precio": 0,
    "categoria": "Médico",
    "introYear": 2000,
    "peso": 0.4,
    "faccion": "General"
  },
  {
    "id": "minigrenade",
    "nombre": "Minigrenade",
    "descripcion": "Arma de área de efecto. Daña a todos los objetivos en el hexágono de impacto y en los adyacentes.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "minolta-9000-advanced-sniper-system",
    "nombre": "Minolta 9000 Advanced Sniper System",
    "descripcion": "Burst (15/3); Jams on a fumble.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "monowire",
    "nombre": "Monowire",
    "descripcion": "+2 TN on attack rolls; aimed attacks only. Uses Power Packs.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "myomer-catalytic-ammo",
    "nombre": "Myomer-Catalytic Ammo",
    "descripcion": "AVAILABLE TO SLUG-THROWERS ONLY; CHEMICAL CATALYST DEALS +3C DAMAGE VS. TARGETS USING MYOMER IMPLANTS (+4C VS TRIPLE-STRENGTH IMPLANTS) IF HIT DELIVERS AT LEAST 1 BD; NO ADDITIONAL EFFECT VS. OTHER TARGETS",
    "precio": 10,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "needler-pistol",
    "nombre": "Needler Pistol",
    "descripcion": "Needler; Burst 5; Recoil -1. Needler weapons suffer a -2 AP modifier against barriers and tactical armor.",
    "precio": 50,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 0.3,
    "faccion": "General"
  },
  {
    "id": "neural-whip",
    "nombre": "Neural Whip",
    "descripcion": "Látigo de alta tecnología que induce un shock neural. Afecta directamente al atributo BODY del objetivo. Requiere Power Packs.",
    "precio": 500,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "neurohelmet-combat",
    "nombre": "Neurohelmet, Combat",
    "descripcion": "+1 to Perception TNs.",
    "precio": 1400,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "neurohelmet-standard",
    "nombre": "Neurohelmet, Standard",
    "descripcion": "-2 to Perception; Encumbering. Neurohelmets are required to safely operate BattleMechs and IndustrialMechs.",
    "precio": 900,
    "categoria": "Equipo",
    "introYear": 2000,
    "peso": 6,
    "faccion": "General"
  },
  {
    "id": "pistol",
    "nombre": "Pistol",
    "descripcion": "Arma de fuego estándar de corto alcance.",
    "precio": 30,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "pistola-autom-tica-b",
    "nombre": "Pistola Automática (B)",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "pistola-de-agujas",
    "nombre": "Pistola de Agujas",
    "descripcion": "Cada 2 de daño reduce la Armadura del objetivo en 1 pip. Los pips del Monitor de Condición se dañan normalmente.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "pistola-de-dardos",
    "nombre": "Pistola de Dardos",
    "descripcion": "El daño es de tipo Fatiga (F).",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "pistola-l-ser-e",
    "nombre": "Pistola Láser (E)",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "placa-bal-stica",
    "nombre": "Placa Balística",
    "descripcion": "-1 a RFL, -3 de daño de armas balísticas (B).",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "porra-aturdidora",
    "nombre": "Porra Aturdidora",
    "descripcion": "El daño es de tipo Fatiga (F).",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "primitive-bow",
    "nombre": "Primitive Bow",
    "descripcion": "SIMPLE ACTION TO RELOAD; –1 TO ATTACK ROLL",
    "precio": 5,
    "categoria": "Equipo",
    "introYear": 2000,
    "peso": 1,
    "faccion": "General"
  },
  {
    "id": "pump-shotgun",
    "nombre": "Pump Shotgun",
    "descripcion": "Puede disparar ambos cañones a la vez para hacer doble daño a un 'área' con un modificador de -1 al To-Hit.",
    "precio": 50,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "rangefinder-binoculars",
    "nombre": "Rangefinder Binoculars",
    "descripcion": "Binoculares con telémetro que proporcionan una lectura LCD del rango aproximado de objetos con un aumento de hasta 100x.",
    "precio": 250,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "rifle-automatic",
    "nombre": "Rifle (Automatic)",
    "descripcion": "Burst: 15; Recoil: -1",
    "precio": 80,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 4,
    "faccion": "General"
  },
  {
    "id": "rifle-de-asalto-b",
    "nombre": "Rifle de Asalto (B)",
    "descripcion": "Puede atacar hasta a dos objetivos diferentes por Narración.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "riot-shield",
    "nombre": "Riot Shield",
    "descripcion": "Provides full cover when crouched; Barrier Integrity: 5. Shields are treated like objects that use the Barrier Armor rules.",
    "precio": 100,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "peso": 2,
    "faccion": "General"
  },
  {
    "id": "shock-staff",
    "nombre": "Shock Staff",
    "descripcion": "AP/BD = 1M/2 WHEN UNPOWERED; SEE SPECIAL GAME RULES",
    "precio": 1500,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 3,
    "faccion": "Esfera Interior"
  },
  {
    "id": "shotgun",
    "nombre": "Shotgun",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "sldf-infantry-fatigues",
    "nombre": "SLDF Infantry Fatigues",
    "descripcion": "Sin descripción.",
    "precio": 900,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 7.8,
    "faccion": "Liga Estelar"
  },
  {
    "id": "sldf-infantry-helmet",
    "nombre": "SLDF Infantry Helmet",
    "descripcion": "INCLUDES MILITARY COMM., IR SCANNER, NIGHT VISION, RANGEFINDER, ELECTRONIC COMPASS; AV 7 VS FLASH; +1 TO PERCEPTION AND SMALL ARMS; POWER USE: 4 PPH",
    "precio": 1500,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 2.1,
    "faccion": "Liga Estelar"
  },
  {
    "id": "sloth",
    "nombre": "Sloth",
    "descripcion": "Heavy quad battle armor designed as a mobile weapons platform. Low profile but limited mobility and manipulation. Moves as a vehicle.",
    "precio": 300000,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "smg",
    "nombre": "SMG",
    "descripcion": "Capaz de realizar fuego de ráfaga.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "smg-gunther-mp-20",
    "nombre": "SMG (Gunther MP-20)",
    "descripcion": "Burst: 10; Recoil: -1",
    "precio": 125,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 2.5,
    "faccion": "Esfera Interior"
  },
  {
    "id": "smg-submachine-gun",
    "nombre": "SMG (Submachine Gun)",
    "descripcion": "Puede disparar en ráfagas de 10 balas para dañar un 'área'.",
    "precio": 500,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "snub-nose-support-ppc",
    "nombre": "Snub-Nose Support PPC",
    "descripcion": "CREW: 3; RECHARGE: 2 TURNS; MOUNTED ON WHEELED CARRIAGE; –2 BD PER RANGE BRACKET BEYOND SHORT",
    "precio": 60000,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 1600,
    "faccion": "Esfera Interior"
  },
  {
    "id": "sonic-stunner",
    "nombre": "Sonic Stunner",
    "descripcion": "Afecta directamente al atributo BODY del objetivo, que debe hacer una tirada de salvación para evitar el efecto.",
    "precio": 100,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "standard-combat-helmet",
    "nombre": "Standard Combat Helmet",
    "descripcion": "-2 to Perception; BAR 3 vs. Flash",
    "precio": 100,
    "categoria": "Vestimenta",
    "introYear": 2000,
    "peso": 3,
    "faccion": "General"
  },
  {
    "id": "sternsnacht-python",
    "nombre": "Sternsnacht Python",
    "descripcion": "Range mods +0/+3/+6/+11.",
    "precio": 0,
    "categoria": "Equipo",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "stun-stick",
    "nombre": "Stun-Stick",
    "descripcion": "Afecta directamente al atributo BODY del objetivo. Requiere Power Packs.",
    "precio": 200,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "stunstick",
    "nombre": "Stunstick",
    "descripcion": "Puede dejar inconsciente al objetivo.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "thunderstroke-gauss-rifle",
    "nombre": "Thunderstroke Gauss Rifle",
    "descripcion": "Encumbering. Uses Power Packs.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "Esfera Interior"
  },
  {
    "id": "traje-de-infiltraci-n",
    "nombre": "Traje de Infiltración",
    "descripcion": "-1 de daño de armas balísticas (B) y de energía (E).",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "variable-pulse-laser-rifle",
    "nombre": "Variable-Pulse Laser Rifle",
    "descripcion": "BURST: 10; RECOIL: 0; RANGE MODIFIERS: +0/+1/+2/+4; –1 BD PER RANGE BRACKET BEYOND SHORT",
    "precio": 4500,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 6,
    "faccion": "Esfera Interior"
  },
  {
    "id": "vibro-blade",
    "nombre": "Vibro-Blade",
    "descripcion": "Versión avanzada de una espada o cuchillo que vibra a alta frecuencia para aumentar su poder de corte. Requiere Power Packs.",
    "precio": 100,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "vibroblade-vibrodagger",
    "nombre": "Vibroblade/Vibrodagger",
    "descripcion": "PPS = Power Points per Shot. *Per power pack.",
    "precio": 100,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 0.35,
    "faccion": "General"
  },
  {
    "id": "vibroespada",
    "nombre": "Vibroespada",
    "descripcion": "Sin descripción.",
    "precio": 0,
    "categoria": "Armas",
    "introYear": 2000,
    "faccion": "General"
  },
  {
    "id": "vibrosword",
    "nombre": "Vibrosword",
    "descripcion": "Subduing: do not add STR",
    "precio": 300,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 4,
    "faccion": "General"
  },
  {
    "id": "vintage-assault-rifle",
    "nombre": "Vintage Assault Rifle",
    "descripcion": "BURST: 10; RECOIL: –1; JAM ON FUMBLE",
    "precio": 2000,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 4.5,
    "faccion": "General"
  },
  {
    "id": "vintage-bulletproof-vest",
    "nombre": "Vintage Bulletproof Vest",
    "descripcion": "Sin descripción.",
    "precio": 500,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 3.1,
    "faccion": "General"
  },
  {
    "id": "vintage-machine-gun",
    "nombre": "Vintage Machine Gun",
    "descripcion": "BURST: 15; RECOIL: –2; ENCUMBERING; JAM ON FUMBLE",
    "precio": 6000,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 11,
    "faccion": "General"
  },
  {
    "id": "vintage-pistol-automatic",
    "nombre": "Vintage Pistol (Automatic)",
    "descripcion": "JAM ON FUMBLE",
    "precio": 500,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 0.5,
    "faccion": "General"
  },
  {
    "id": "zweih-nder-sword",
    "nombre": "Zweihänder Sword",
    "descripcion": "–2 TO ATTACK ROLL; TWO-HANDED SWORD",
    "precio": 60,
    "categoria": "Armas",
    "introYear": 2000,
    "peso": 5.1,
    "faccion": "General"
  }
];
