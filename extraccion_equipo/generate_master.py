import os
import json
import re
from collections import defaultdict

DIR = r"E:\Drive\CBT\CFRM-firebase\extraccion_equipo"
JSON_FILES = [
    "Mechwarrior 1 The Battletech Rpg Game_equipment.json",
    "Mechwarrior 2 The Battletech Rpg Game_equipment.json",
    "Mechwarrior 3 The Battletech Rpg Game_equipment.json",
    "Mechwarrior 3 LostTech The Battletech Rpg Game_equipment.json",
    "A Time of War_equipment.json",
    "A Time of War- Companion_equipment.json",
    "Destiny_equipment.json"
]

BOOK_ACRONYMS = {
    "Mechwarrior 1 The Battletech Rpg Game": "MW1e",
    "Mechwarrior 2 The Battletech Rpg Game": "MW2e",
    "Mechwarrior 3 The Battletech Rpg Game": "MW3e",
    "Mechwarrior 3 LostTech The Battletech Rpg Game": "LostTech",
    "A Time of War": "AToW",
    "A Time of War- Companion": "AToW Comp",
    "Destiny": "Destiny"
}

def parse_precio(cost_str):
    if not cost_str: return 0
    # extrae el primer numero
    s = str(cost_str).split('/')[0] # En caso de que sea Cost/Reload
    s = s.replace(',', '')
    match = re.search(r'\d+', s)
    return int(match.group()) if match else 0

def parse_peso(mass_str):
    if not mass_str: return 0.0
    s = str(mass_str).split('/')[0].upper()
    s = s.replace(',', '')
    match = re.search(r'([\d\.]+)\s*(KG|G)?', s)
    if match:
        val = float(match.group(1))
        unit = match.group(2)
        if unit == 'G': return val / 1000.0
        return val
    return 0.0

def parse_faccion(aff_str):
    if not aff_str: return "General"
    aff = str(aff_str).upper()
    if 'CLAN' in aff: return "Clanes"
    if 'SLDF' in aff or 'STAR LEAGUE' in aff: return "Liga Estelar"
    if aff in ['FS', 'DC', 'FW', 'LA', 'CC', 'MC', 'COM']: return "Esfera Interior"
    return "General"

def map_to_master(eq_data):
    stats = eq_data.get('stats', {})
    cat_orig = eq_data.get('category_orig', '').lower()
    
    # Heuristics for category
    categoria = "Equipo"
    if "arma" in cat_orig or "weapon" in cat_orig or "pistol" in cat_orig or "rifle" in cat_orig:
        categoria = "Armas"
    elif "armadura" in cat_orig or "armor" in cat_orig or "suit" in cat_orig or "vest" in cat_orig:
        categoria = "Vestimenta"
    elif "med" in cat_orig or "médico" in cat_orig:
        categoria = "Médico"
        
    cost = stats.get('Cost', stats.get('Cost/Reload', stats.get('cost', stats.get('cost_cbills', stats.get('Cost/Patch', 0)))))
    mass = stats.get('Mass', stats.get('Mass/Reload', stats.get('weight', stats.get('weight_kg', 0))))
    aff = stats.get('Aff', stats.get('Affiliation', ''))
    
    precio = parse_precio(cost)
    peso = parse_peso(mass)
    faccion = parse_faccion(aff)
    
    nombre = eq_data['original_name']
    
    res = {
        "id": re.sub(r'[^a-z0-9]+', '-', nombre.lower()).strip('-'),
        "nombre": nombre,
        "descripcion": eq_data.get('rules', '') or 'Sin descripción.',
        "precio": precio,
        "categoria": categoria,
        "introYear": 2000,
        "faccion": faccion
    }
    if peso > 0:
        res["peso"] = peso
        
    return res

def process_equipment():
    items = defaultdict(dict)
    
    for filename in JSON_FILES:
        path = os.path.join(DIR, filename)
        if not os.path.exists(path):
            continue
            
        with open(path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                continue
            
            raw_book_name = data.get("source_book", filename.replace("_equipment.json", ""))
            book_name = BOOK_ACRONYMS.get(raw_book_name, raw_book_name)
            
            for eq in data.get("equipment", []):
                name = eq.get("name", "Unknown").strip()
                stats = eq.get("stats", {})
                rules = eq.get("rules", "")
                cat_orig = eq.get("category", "")
                
                n_name = name.lower()
                
                stat_str = "<br>".join([f"**{k}**: {v}" for k, v in stats.items()])
                if rules:
                    stat_str += f"<br>*Reglas: {rules}*"
                stat_str = stat_str.replace("|", "/")
                
                items[n_name][book_name] = {
                    "original_name": name, 
                    "details": stat_str,
                    "stats": stats,
                    "rules": rules,
                    "category_orig": cat_orig
                }
                
    master_list = []
    conflicts = {}
    
    for n_name in sorted(items.keys()):
        book_data = items[n_name]
        
        # Unica version
        if len(book_data) == 1:
            only_book = list(book_data.keys())[0]
            eq_data = book_data[only_book]
            master_list.append(map_to_master(eq_data))
        else:
            conflicts[n_name] = book_data
            
    # Guardar nuevo-equipo.json
    master_path = r"E:\Drive\CBT\CFRM-firebase\nuevo-equipo.json"
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master_list, f, indent=2, ensure_ascii=False)
        
    # Guardar informe comparativo (solo conflictos)
    md_lines = ["# Informe Comparativo de Equipo (Solo Conflictos)\n"]
    md_lines.append("Este informe agrupa los objetos que aparecen en múltiples manuales con estadísticas conflictivas. Los objetos con una sola versión han sido movidos a `nuevo-equipo.json`.\n")
    
    all_books = []
    for book_data in conflicts.values():
        for b in book_data.keys():
            if b not in all_books:
                all_books.append(b)
                
    ordered_acronyms = [BOOK_ACRONYMS.get(f.replace("_equipment.json", ""), f.replace("_equipment.json", "")) for f in JSON_FILES]
    all_books.sort(key=lambda x: ordered_acronyms.index(x) if x in ordered_acronyms else 99)
    
    header = "| Equipo | " + " | ".join(all_books) + " |"
    separator = "|---|" + "|".join(["---" for _ in all_books]) + "|"
    md_lines.append(header)
    md_lines.append(separator)
    
    for n_name in sorted(conflicts.keys()):
        book_data = conflicts[n_name]
        orig_name = list(book_data.values())[0]["original_name"]
        row = f"| **{orig_name}** |"
        for book in all_books:
            if book in book_data:
                row += f" {book_data[book]['details']} |"
            else:
                row += " - |"
        md_lines.append(row)
        
    report_path = os.path.join(DIR, "informe_comparativo_conflictos.md")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(md_lines))
        
    print(f"Master list: {len(master_list)} items guardados en {master_path}")
    print(f"Conflictos: {len(conflicts)} items guardados en {report_path}")

if __name__ == "__main__":
    process_equipment()
