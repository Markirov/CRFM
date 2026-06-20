import os
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
PDF_DIR = r"E:\Drive\CBT\CFRM-firebase\herramientas\PDFs"
BOOKS_TO_USE = [
    "Total Warfare Nuevo.pdf"
]

def build_topic(topic_name):
    print(f"Iniciando extracción temática: {topic_name}")
    client = genai.Client(api_key=API_KEY)
    
    # 1. Upload files to Gemini
    uploaded_files = []
    for book in BOOKS_TO_USE:
        path = os.path.join(PDF_DIR, book)
        print(f"Subiendo {book} a Gemini...")
        # Uploading file
        uploaded_file = client.files.upload(file=path, config={'display_name': book})
        uploaded_files.append(uploaded_file)
        
    print("Esperando a que los archivos se procesen en el servidor...")
    for f in uploaded_files:
        while True:
            f_info = client.files.get(name=f.name)
            if f_info.state == 'ACTIVE':
                break
            elif f_info.state == 'FAILED':
                print(f"Error procesando el archivo {f.name}")
                return
            time.sleep(2)
            
    print("Archivos listos. Solicitando extracción de reglas...")
    
    prompt = f"""
    Eres un experto organizador de reglas de BattleTech.
    Analiza exhaustivamente los manuales adjuntos (Total Warfare, TechManual y Tactical Operations) para el tema: "{topic_name}".
    
    Ignora TODO el "lore" y las descripciones narrativas (fluff). Quédate SOLO con las reglas crudas (crunch), mecánicas, modificadores y tablas de estadísticas.
    Diferencia claramente las reglas Estándar (de Total Warfare) de las Avanzadas (de Tactical Operations).
    
    Genera un objeto JSON con dos claves:
    1. "markdown": Un string con el contenido formateado para una Wiki (usa ##, tablas de markdown, y añade un resumen unificado al principio). Utiliza español.
    2. "data": Un array JSON con los datos estructurados numéricos extraídos (por ejemplo, si es armas, extrae Nombre, Daño, Calor, Rango, Peso, etc.).

    Devuelve ÚNICAMENTE el JSON válido.
    """
    
    # We pass the uploaded files and the prompt
    contents = uploaded_files + [prompt]
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=contents,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0
        )
    )
    
    try:
        result = json.loads(response.text)
        
        # Save MD
        os.makedirs(r"E:\Drive\CBT\CFRM-firebase\docs\armas\energia", exist_ok=True)
        md_path = r"E:\Drive\CBT\CFRM-firebase\docs\armas\energia\laseres.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(result["markdown"])
            
        # Save JSON
        os.makedirs(r"E:\Drive\CBT\CFRM-firebase\data\rules\armas\energia", exist_ok=True)
        json_path = r"E:\Drive\CBT\CFRM-firebase\data\rules\armas\energia\laseres.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(result["data"], f, indent=2, ensure_ascii=False)
            
        print(f"¡Éxito! Generados:\n- {md_path}\n- {json_path}")
        
    except Exception as e:
        print(f"Error parseando el resultado: {e}")
        print("Respuesta raw:", response.text[:500])
        
    # Cleanup files
    for f in uploaded_files:
        client.files.delete(name=f.name)

if __name__ == "__main__":
    build_topic("Armas de Energía (Láseres, PPCs, etc)")
