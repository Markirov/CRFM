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
client = genai.Client(api_key=API_KEY)

TARGETS = {
    "Unidades de Combate y Tipos": {
        "books": ["Total Warfare Nuevo.pdf", "TechManual.pdf"],
        "subcats": [
            "Unidades Aeroespaciales (Cazas, Naves de Descenso)",
            "Naves Capitales (Naves de Salto, Naves de Guerra, Estaciones)",
            "Vehículos de Apoyo y Estructuras Móviles"
        ]
    },
    "Entorno y Terreno de Batalla": {
        "books": ["Total Warfare Nuevo.pdf", "E-CAT35003V_Tactical_Operations.pdf"],
        "subcats": [
            "Tipos de Terreno y sus Efectos",
            "Edificios y Combate Urbano",
            "Condiciones Planetarias (Clima, Gravedad)",
            "Combate en Gravedad Cero",
            "Obstáculos Orbitales (Asteroides, Escombros)",
            "Combate Submarino y Naval"
        ]
    }
}

SINGLE_FIXES = [
    {
        "cat": "Construcción y Personalización",
        "subcat": "Peculiaridades de Diseño (Design Quirks)",
        "book": "Strategic Operations Nuevo.pdf" # Actually TechManual or StratOps. Let's use TechManual.
    },
    {
        "cat": "Equipo Personal (RPG)",
        "subcat": "Armas Pequeñas y de Apoyo",
        "book": "A Time of War.pdf"
    }
]

SINGLE_FIXES[0]["book"] = "TechManual.pdf"

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def extract_single_book(book_name, category_name, subcat_name, phase_text):
    path = os.path.join(PDF_DIR, book_name)
    print(f"    Subiendo {book_name}...")
    f_up = client.files.upload(file=path, config={'display_name': book_name})
    
    while True:
        f_info = client.files.get(name=f_up.name)
        if f_info.state == 'ACTIVE': break
        elif f_info.state == 'FAILED': raise Exception("Fallo al procesar PDF")
        time.sleep(3)
        
    prompt = f"""
    Eres un experto en BattleTech. Extrae las {phase_text} para el tema: "{subcat_name}" dentro de "{category_name}".
    Ignora todo el lore. Extrae solo mecánicas crudas y tablas estadísticas.
    
    Genera un JSON:
    1. "markdown": El texto en español estructurado.
    2. "data": Un array con datos tabulares.
    Devuelve SOLO JSON válido.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=[f_up, prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.0)
        )
        res_json = json.loads(response.text)
    finally:
        client.files.delete(name=f_up.name)
        
    return res_json

def merge_results(res1, res2, subcat_name):
    prompt = f"""
    Eres un organizador de reglas de BattleTech. Tienes dos extracciones de datos para el tema '{subcat_name}'.
    
    Extracción Estándar (Libro 1):
    {json.dumps(res1, ensure_ascii=False)}
    
    Extracción Avanzada/Expansión (Libro 2):
    {json.dumps(res2, ensure_ascii=False)}
    
    Fusiona estos dos en un ÚNICO objeto JSON de salida que contenga:
    1. "markdown": Un string que explique primero las reglas estándar y luego las reglas avanzadas bajo el subtítulo '## Reglas Avanzadas'.
    2. "data": Combina los elementos de los arrays de ambas extracciones en un solo array.
    Devuelve SOLO el JSON unificado válido.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=[prompt],
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.0)
    )
    return json.loads(response.text)

def save_result(cat_name, subcat_name, result):
    cat_slug = slugify(cat_name)
    subcat_slug = slugify(subcat_name)
    
    os.makedirs(rf"E:\Drive\CBT\CFRM-firebase\docs\{cat_slug}", exist_ok=True)
    os.makedirs(rf"E:\Drive\CBT\CFRM-firebase\data\rules\{cat_slug}", exist_ok=True)
    
    md_path = rf"E:\Drive\CBT\CFRM-firebase\docs\{cat_slug}\{subcat_slug}.md"
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(f"# {subcat_name}\n\n" + result["markdown"])
        
    json_path = rf"E:\Drive\CBT\CFRM-firebase\data\rules\{cat_slug}\{subcat_slug}.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(result["data"], f, indent=2, ensure_ascii=False)

def run():
    print("=== INICIANDO EXTRACCIÓN CRUZADA (MERGE) ===")
    
    for cat_name, info in TARGETS.items():
        print(f"\n--- PROCESANDO: {cat_name} ---")
        book_std = info["books"][0]
        book_adv = info["books"][1]
        
        for subcat in info["subcats"]:
            print(f"\n  >> Tema: {subcat}")
            try:
                print("    Fase 1: Extrayendo Reglas Estándar...")
                res_std = extract_single_book(book_std, cat_name, subcat, "Reglas Estándar")
                time.sleep(10)
                
                print("    Fase 2: Extrayendo Reglas Avanzadas/Expansiones...")
                res_adv = extract_single_book(book_adv, cat_name, subcat, "Reglas Avanzadas y Expansiones de Construcción")
                time.sleep(10)
                
                print("    Fase 3: Fusionando datos con IA...")
                merged = merge_results(res_std, res_adv, subcat)
                
                save_result(cat_name, subcat, merged)
                print("    OK -> Guardado fusionado")
            except Exception as e:
                print(f"    ERROR: {e}")
            time.sleep(15)

    print("\n--- REPARANDO ARCHIVOS SUELTOS ---")
    for fix in SINGLE_FIXES:
        print(f"\n  >> Reparando: {fix['subcat']}")
        try:
            res = extract_single_book(fix['book'], fix['cat'], fix['subcat'], "Reglas Completas")
            save_result(fix['cat'], fix['subcat'], res)
            print("    OK -> Reparado")
        except Exception as e:
            print(f"    ERROR: {e}")
        time.sleep(15)
        
    print("\n=== PROCESO FINALIZADO ===")

if __name__ == "__main__":
    run()
