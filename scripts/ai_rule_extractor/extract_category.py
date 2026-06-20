import os
import json
import time
import re
import argparse
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
PDF_DIR = r"E:\Drive\CBT\CFRM-firebase\herramientas\PDFs"
BOOKS_TO_USE = [
    "Total Warfare Nuevo.pdf" # Solo TW para evitar límite de 1M tokens
]

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def get_category_data(category_name):
    with open('wiki-tree.json', 'r', encoding='utf-8') as f:
        tree = json.load(f)
    for cat in tree:
        if cat['name'] == category_name:
            return cat
    return None

def extract_category(category_name):
    cat_data = get_category_data(category_name)
    if not cat_data:
        print(f"Categoría '{category_name}' no encontrada en wiki-tree.json")
        return

    print(f"--- Iniciando Batch: {category_name} ---")
    client = genai.Client(api_key=API_KEY)
    
    # 1. Upload files
    uploaded_files = []
    for book in BOOKS_TO_USE:
        path = os.path.join(PDF_DIR, book)
        print(f"Subiendo {book} a Gemini...")
        f = client.files.upload(file=path, config={'display_name': book})
        uploaded_files.append(f)
        
    print("Esperando a que los archivos se procesen...")
    for f in uploaded_files:
        while True:
            f_info = client.files.get(name=f.name)
            if f_info.state == 'ACTIVE':
                break
            elif f_info.state == 'FAILED':
                print(f"Error procesando {f.name}")
                return
            time.sleep(2)
            
    print("Archivos listos. Iniciando extracción por subcategoría...")
    
    cat_slug = slugify(category_name)
    os.makedirs(rf"E:\Drive\CBT\CFRM-firebase\docs\{cat_slug}", exist_ok=True)
    os.makedirs(rf"E:\Drive\CBT\CFRM-firebase\data\rules\{cat_slug}", exist_ok=True)
    
    for subcat in cat_data['subcategories']:
        print(f"\n>> Extrayendo: {subcat}...")
        subcat_slug = slugify(subcat)
        
        prompt = f"""
        Eres un experto organizador de reglas de BattleTech.
        Analiza el manual adjunto (Total Warfare) para el tema específico: "{subcat}" dentro del bloque "{category_name}".
        
        Ignora TODO el "lore" y descripciones narrativas. Quédate SOLO con las reglas crudas, mecánicas, modificadores y tablas de estadísticas.
        
        Genera un objeto JSON con dos claves:
        1. "markdown": Un string con el contenido formateado para una Wiki (usa ##, tablas de markdown, negritas, y añade un resumen claro al principio). Utiliza español.
        2. "data": Un array JSON con los datos estructurados numéricos extraídos de las tablas pertinentes, si las hay.

        Si no encuentras información sobre este tema exacto, genera un markdown diciendo "Información no encontrada en las reglas estándar." y un array data vacío [].
        Devuelve ÚNICAMENTE el JSON válido.
        """
        
        contents = uploaded_files + [prompt]
        
        try:
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0
                )
            )
            
            result = json.loads(response.text)
            
            md_path = rf"E:\Drive\CBT\CFRM-firebase\docs\{cat_slug}\{subcat_slug}.md"
            with open(md_path, 'w', encoding='utf-8') as f:
                # Add title for VitePress
                f.write(f"# {subcat}\n\n" + result["markdown"])
                
            json_path = rf"E:\Drive\CBT\CFRM-firebase\data\rules\{cat_slug}\{subcat_slug}.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(result["data"], f, indent=2, ensure_ascii=False)
                
            print(f"OK -> {subcat_slug}")
            
        except Exception as e:
            print(f"Error extrayendo {subcat}: {e}")
            
        print("Pausa anti-baneo de 20 segundos...")
        time.sleep(20) # Pausa para evitar rate limits
        
    # Cleanup files
    print("\nLimpiando archivos en Gemini...")
    for f in uploaded_files:
        client.files.delete(name=f.name)
        
    print(f"--- Batch de {category_name} Finalizado ---")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Batch extract a category.')
    parser.add_argument('category', type=str, help='El nombre exacto de la categoría en wiki-tree.json')
    args = parser.parse_args()
    extract_category(args.category)
