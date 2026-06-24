import os
import json
import re

DIR = r"E:\Drive\CBT\CFRM-firebase\extraccion_equipo"
MASTER_JSON = r"E:\Drive\CBT\CFRM-firebase\nuevo-equipo.json"

def parse_precio(cost_str):
    if not cost_str: return 0
    s = str(cost_str).split('/')[0]
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
    cat_orig = eq_data.get('category', '').lower()
    
    categoria = "Equipo"
    if "arma" in cat_orig or "weapon" in cat_orig or "pistol" in cat_orig or "rifle" in cat_orig or "blade" in cat_orig:
        categoria = "Armas"
    elif "armadura" in cat_orig or "armor" in cat_orig or "suit" in cat_orig or "vest" in cat_orig:
        categoria = "Vestimenta"
    elif "med" in cat_orig or "médico" in cat_orig:
        categoria = "Médico"
        
    cost = stats.get('Cost', stats.get('Cost/Reload', stats.get('cost', stats.get('cost_cbills', stats.get('Cost/Patch', stats.get('Cost_Patch', 0))))))
    mass = stats.get('Mass', stats.get('Mass/Reload', stats.get('weight', stats.get('weight_kg', stats.get('Weight', 0)))))
    aff = stats.get('Aff', stats.get('Affiliation', ''))
    
    precio = parse_precio(cost)
    peso = parse_peso(mass)
    faccion = parse_faccion(aff)
    
    nombre = eq_data.get('name', 'Unknown')
    rules = eq_data.get('rules', '')
    
    res = {
        "id": re.sub(r'[^a-z0-9]+', '-', nombre.lower()).strip('-'),
        "nombre": nombre,
        "descripcion": rules or 'Sin descripción.',
        "precio": precio,
        "categoria": categoria,
        "introYear": 2000,
        "faccion": faccion
    }
    if peso > 0:
        res["peso"] = peso
        
    return res

# The choices from the user
# Format: (Item Name, Target Book Filename)
CHOICES = [
    ("Ablative Armor (Suit)", "A Time of War_equipment.json"),
    ("Auto-Pistol", "Mechwarrior 2 The Battletech Rpg Game_equipment.json"),
    ("Ballistic Plate Armor (Suit)", "A Time of War_equipment.json"),
    ("I/R Scanner", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("Industrial Exoskeleton", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("Katana", "Mechwarrior 3 LostTech The Battletech Rpg Game_equipment.json"),
    ("Laser Pistol", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("Laser Rifle", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("MechWarrior Combat Suit", "Mechwarrior 2 The Battletech Rpg Game_equipment.json"),
    ("MedKit", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("Rifle", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("SRM Launcher", "Mechwarrior 2 The Battletech Rpg Game_equipment.json"),
    ("Sword", "Mechwarrior 1 The Battletech Rpg Game_equipment.json"),
    ("Vibroblade", "Mechwarrior 3 LostTech The Battletech Rpg Game_equipment.json")
]

def main():
    # Load existing master list
    if not os.path.exists(MASTER_JSON):
        print(f"File {MASTER_JSON} not found!")
        return
        
    with open(MASTER_JSON, 'r', encoding='utf-8') as f:
        master_list = json.load(f)
        
    added = 0
    for item_name, book_file in CHOICES:
        path = os.path.join(DIR, book_file)
        if not os.path.exists(path):
            print(f"Book {book_file} not found!")
            continue
            
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        found = False
        for eq in data.get('equipment', []):
            if eq.get('name', '').strip() == item_name:
                mapped = map_to_master(eq)
                master_list.append(mapped)
                added += 1
                found = True
                break
                
        if not found:
            print(f"Item '{item_name}' not found in {book_file}!")
            
    # Save back
    with open(MASTER_JSON, 'w', encoding='utf-8') as f:
        json.dump(master_list, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully appended {added} items. Master list now has {len(master_list)} items.")

if __name__ == "__main__":
    main()
