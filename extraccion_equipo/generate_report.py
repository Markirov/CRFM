import os
import json
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

# Acrónimos cortos para las columnas para evitar una tabla inmensamente ancha
BOOK_ACRONYMS = {
    "Mechwarrior 1 The Battletech Rpg Game": "MW1e",
    "Mechwarrior 2 The Battletech Rpg Game": "MW2e",
    "Mechwarrior 3 The Battletech Rpg Game": "MW3e",
    "Mechwarrior 3 LostTech The Battletech Rpg Game": "LostTech",
    "A Time of War": "AToW",
    "A Time of War- Companion": "AToW Comp",
    "Destiny": "Destiny"
}

def generate_report():
    # item_name -> { book_name: stats_dict }
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
                
                # normalizamos el nombre (para agrupar)
                n_name = name.lower()
                
                # convert stats dict to string
                stat_str = "<br>".join([f"**{k}**: {v}" for k, v in stats.items()])
                if rules:
                    stat_str += f"<br>*Reglas: {rules}*"
                    
                # Reemplazamos | por / para no romper la tabla markdown
                stat_str = stat_str.replace("|", "/")
                
                items[n_name][book_name] = {"original_name": name, "details": stat_str}
                
    md_lines = ["# Informe Comparativo de Equipo Personal por Edición\n"]
    md_lines.append("Este informe agrupa los objetos encontrados en los manuales extraídos, separando las estadísticas por edición para evidenciar el choque de reglas y facilitar la decisión de consolidación.\n")
    
    # agrupamos por libros encontrados
    all_books = []
    for book_data in items.values():
        for b in book_data.keys():
            if b not in all_books:
                all_books.append(b)
                
    # Ordenar los libros según aparecen en JSON_FILES
    ordered_acronyms = [BOOK_ACRONYMS.get(f.replace("_equipment.json", ""), f.replace("_equipment.json", "")) for f in JSON_FILES]
    all_books.sort(key=lambda x: ordered_acronyms.index(x) if x in ordered_acronyms else 99)
    
    # Construir cabecera de la tabla
    header = "| Equipo | " + " | ".join(all_books) + " |"
    separator = "|---|" + "|".join(["---" for _ in all_books]) + "|"
    
    md_lines.append(header)
    md_lines.append(separator)
    
    for n_name in sorted(items.keys()):
        book_data = items[n_name]
        orig_name = list(book_data.values())[0]["original_name"]
        
        row = f"| **{orig_name}** |"
        for book in all_books:
            if book in book_data:
                row += f" {book_data[book]['details']} |"
            else:
                row += " - |"
                
        md_lines.append(row)
        
    output_path = os.path.join(DIR, "informe_comparativo.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(md_lines))
        
    print(f"Reporte generado en: {output_path}")
        
if __name__ == "__main__":
    generate_report()
