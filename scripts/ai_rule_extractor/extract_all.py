import os
import json
import time
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
PDF_DIR = r"E:\Drive\CBT\CFRM-firebase\herramientas\PDFs"

# Mapa de fuentes inteligentes para no superar el límite de memoria de Gemini
SOURCE_MAPPING = {
    "Mecánicas Fundamentales del Juego": ["Total Warfare Nuevo.pdf"],
    "Movimiento Terrestre": ["Total Warfare Nuevo.pdf", "E-CAT35003V_Tactical_Operations.pdf"],
    "Movimiento Aeroespacial": ["Total Warfare Nuevo.pdf", "Strategic Operations Nuevo.pdf"],
    "Combate a Distancia (Armas)": ["Total Warfare Nuevo.pdf", "E-CAT35003V_Tactical_Operations.pdf"],
    "Combate Físico (Cuerpo a Cuerpo)": ["Total Warfare Nuevo.pdf", "E-CAT35003V_Tactical_Operations.pdf"],
    "Calor, Daño y Efectos Críticos": ["Total Warfare Nuevo.pdf", "E-CAT35003V_Tactical_Operations.pdf"],
    "Unidades de Combate y Tipos": ["Total Warfare Nuevo.pdf", "TechManual.pdf"],
    "Entorno y Terreno de Batalla": ["Total Warfare Nuevo.pdf", "E-CAT35003V_Tactical_Operations.pdf"],
    "Organización y Mando": ["E-CAT35007_BattleTech_Campaign_Operations_3rdPrint.pdf"],
    "Escenarios y Campañas": ["E-CAT35007_BattleTech_Campaign_Operations_3rdPrint.pdf"],
    "Gestión de Campañas": ["E-CAT35007_BattleTech_Campaign_Operations_3rdPrint.pdf"],
    "Construcción y Personalización": ["TechManual.pdf", "Strategic Operations Nuevo.pdf"],
    "Personajes y Pilotos (RPG)": ["A Time of War.pdf"],
    "Equipo Personal (RPG)": ["A Time of War.pdf"]
}

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def run_total_extraction():
    client = genai.Client(api_key=API_KEY)
    
    with open('wiki-tree.json', 'r', encoding='utf-8') as f:
        tree = json.load(f)
        
    print("=== INICIANDO EXTRACCIÓN TOTAL ===")
    
    for cat in tree:
        cat_name = cat['name']
        
        if cat_name == "Armas y Equipo (Unidades)":
            print(f"\n[SALTANDO] Categoría '{cat_name}' (Ya completada en la fase de prueba)")
            continue
            
        books_to_use = SOURCE_MAPPING.get(cat_name)
        if not books_to_use:
            print(f"\n[SALTANDO] Categoría '{cat_name}' (Sin mapeo de libros)")
            continue
            
        print(f"\n--- PROCESANDO CATEGORÍA: {cat_name} ---")
        uploaded_files = []
        try:
            # Subir archivos a Gemini
            for book in books_to_use:
                path = os.path.join(PDF_DIR, book)
                print(f"  Subiendo {book} a Gemini...")
                f_up = client.files.upload(file=path, config={'display_name': book})
                uploaded_files.append(f_up)
                
            print("  Esperando procesamiento en la nube...")
            for f_up in uploaded_files:
                while True:
                    f_info = client.files.get(name=f_up.name)
                    if f_info.state == 'ACTIVE':
                        break
                    elif f_info.state == 'FAILED':
                        raise Exception(f"Fallo al procesar {f_up.name} en Gemini")
                    time.sleep(3)
                    
            cat_slug = slugify(cat_name)
            os.makedirs(rf"E:\Drive\CBT\CFRM-firebase\docs\{cat_slug}", exist_ok=True)
            os.makedirs(rf"E:\Drive\CBT\CFRM-firebase\data\rules\{cat_slug}", exist_ok=True)
            
            for subcat in cat['subcategories']:
                print(f"    >> Extrayendo: {subcat}...")
                subcat_slug = slugify(subcat)
                
                prompt = f"""
                Eres un experto organizador de reglas de BattleTech.
                Analiza los manuales adjuntos para el tema específico: "{subcat}" dentro del bloque "{cat_name}".
                
                Ignora TODO el "lore" y descripciones narrativas. Quédate SOLO con las reglas crudas, mecánicas, modificadores y tablas de estadísticas.
                Si ves que hay Reglas Estándar y Reglas Avanzadas, sepáralas claramente con subtítulos.
                
                Genera un objeto JSON con dos claves:
                1. "markdown": Un string con el contenido formateado para una Wiki (usa ##, tablas de markdown, negritas, y añade un resumen claro al principio). Utiliza español.
                2. "data": Un array JSON con los datos estructurados numéricos extraídos de las tablas pertinentes (si las hay, sino un array vacío []).

                Si no encuentras información sobre este tema en los libros adjuntos, genera un markdown diciendo "Información no encontrada en estos manuales." y un array data vacío [].
                Devuelve ÚNICAMENTE el JSON válido, sin delimitadores ```json adicionales.
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
                    with open(md_path, 'w', encoding='utf-8') as f_out:
                        f_out.write(f"# {subcat}\n\n" + result["markdown"])
                        
                    json_path = rf"E:\Drive\CBT\CFRM-firebase\data\rules\{cat_slug}\{subcat_slug}.json"
                    with open(json_path, 'w', encoding='utf-8') as f_out:
                        json.dump(result["data"], f_out, indent=2, ensure_ascii=False)
                        
                    print(f"      OK -> {subcat_slug}")
                    
                except Exception as e:
                    print(f"      ERROR extrayendo {subcat}: {e}")
                    
                # Pausa para evitar rate limit
                time.sleep(20)
                
        except Exception as global_e:
            print(f"  ERROR EN CATEGORÍA {cat_name}: {global_e}")
            
        finally:
            print("  Limpiando archivos de Gemini...")
            for f_up in uploaded_files:
                try:
                    client.files.delete(name=f_up.name)
                except:
                    pass

    print("\n=== EXTRACCIÓN TOTAL FINALIZADA ===")

if __name__ == "__main__":
    run_total_extraction()
