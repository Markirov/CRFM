import os
import json
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIKI_TREE = os.path.join(ROOT, "wiki-tree.json")
RULES_DIR = os.path.join(ROOT, "data", "rules")
OUT_FILE = os.path.join(ROOT, "docs", ".vitepress", "dictionary.json")

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

dictionary = {}
dictionary_lower = set()

def add_term(term, url_path):
    term = str(term).strip()
    if len(term) < 4: return
    if term.isdigit(): return
    if term.lower() in ["ninguno", "n/a", "varía", "todos", "estándar", "avanzado"]: return
    
    # Limpiar lo que está entre paréntesis ej. "Láser Medio (P)" -> "Láser Medio"
    clean_term = re.sub(r'\s*\([^)]*\)', '', term).strip()
    
    if len(clean_term) >= 4 and clean_term.lower() not in dictionary_lower:
        dictionary[clean_term] = url_path
        dictionary_lower.add(clean_term.lower())

# 1. Leer taxonomía principal
with open(WIKI_TREE, "r", encoding="utf-8") as f:
    tree = json.load(f)

for cat in tree:
    cat_slug = slugify(cat["name"])
    for sub in cat["subcategories"]:
        sub_slug = slugify(sub)
        url = f"/wiki/{cat_slug}/{sub_slug}"
        add_term(sub, url)

# 2. Leer todos los JSONs de reglas para extraer armas, equipo, terreno, etc.
NAME_KEYS = ["arma", "nombre", "tipo", "terreno", "edificio", "equipo", "vehículo", "misil", "sistema", "munición", "habilidad", "rasgo", "defecto"]

for root_dir, _, files in os.walk(RULES_DIR):
    for file in files:
        if file.endswith(".json"):
            cat_folder = os.path.basename(root_dir)
            subcat_slug = file.replace(".json", "")
            
            url = f"/wiki/{cat_folder}/{subcat_slug}"
            
            filepath = os.path.join(root_dir, file)
            with open(filepath, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    def extract_names(obj):
                        if isinstance(obj, list):
                            for item in obj:
                                extract_names(item)
                        elif isinstance(obj, dict):
                            for k, v in obj.items():
                                if isinstance(v, str) and any(nk in k.lower() for nk in NAME_KEYS):
                                    add_term(v, url)
                                extract_names(v)
                    extract_names(data)
                except Exception as e:
                    pass

# Guardar diccionario
os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(dictionary, f, ensure_ascii=False, indent=2)

print(f"✅ Diccionario creado con {len(dictionary)} términos mágicos.")
