import os
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

API_KEY = os.getenv("GEMINI_API_KEY")
PDF_DIR = r"E:\Drive\CBT\Garduña\Manuales"

BOOKS_TO_USE = [
    "Mechwarrior 1 The Battletech Rpg Game.pdf",
    "Mechwarrior 2 The Battletech Rpg Game.pdf",
    "Mechwarrior 3 The Battletech Rpg Game.pdf",
    "Mechwarrior 3 LostTech The Battletech Rpg Game.pdf",
    "A Time of War.pdf",
    "A Time of War- Companion.pdf",
    "Destiny.pdf",
]

def extract_equipment():
    if not API_KEY:
        print("ERROR: GEMINI_API_KEY no encontrada en las variables de entorno.")
        return

    client = genai.Client(api_key=API_KEY)
    
    for book in BOOKS_TO_USE:
        path = os.path.join(PDF_DIR, book)
        if not os.path.exists(path):
            print(f"File {path} not found. Skipping...")
            continue
            
        print(f"\n--- Procesando {book} ---")
        try:
            uploaded_file = client.files.upload(file=path, config={'display_name': book})
        except Exception as e:
            print(f"Error subiendo {book}: {e}")
            continue
            
        while True:
            f_info = client.files.get(name=uploaded_file.name)
            if f_info.state == 'ACTIVE':
                break
            elif f_info.state == 'FAILED':
                print(f"Error en servidor procesando el archivo {uploaded_file.name}")
                break
            time.sleep(2)
            
        if f_info.state == 'FAILED':
            client.files.delete(name=uploaded_file.name)
            continue
            
        print("Archivo listo. Solicitando extracción de reglas de equipo...")
        
        prompt = """
        Eres un experto organizador de reglas de BattleTech y juegos de rol.
        Analiza el manual de rol adjunto y extrae información sobre el EQUIPO PERSONAL (armas, armaduras, equipo médico, equipo electrónico, etc).
        Ignora el lore, reglas de combate mecha, creación de personajes, etc. Céntrate SÓLO en el equipo personal, sus reglas y tablas de estadísticas.
        
        Genera un objeto JSON con la siguiente estructura:
        {
          "source_book": "nombre_del_libro",
          "equipment": [
            {
              "category": "Armas / Armaduras / Equipo...",
              "name": "Nombre del objeto",
              "stats": {
                // Atributos específicos del libro (ej: Daño, Alcance, Coste, Peso, AP/BD, etc)
              },
              "rules": "Reglas especiales resumidas o notas (opcional)"
            }
          ]
        }
        
        Devuelve ÚNICAMENTE el JSON válido. Si hay demasiados objetos para una sola respuesta, concéntrate en extraer las ARMAS y ARMADURAS más representativas de las tablas resumen.
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=[uploaded_file, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0
                )
            )
            
            result = json.loads(response.text)
            
            output_path = os.path.join(r"E:\Drive\CBT\CFRM-firebase\extraccion_equipo", f"{book.replace('.pdf', '')}_equipment.json")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
                
            print(f"¡Éxito! Guardado en: {output_path}")
            
        except Exception as e:
            print(f"Error parseando el resultado de {book}: {e}")
            if 'response' in locals() and hasattr(response, 'text'):
                print("Respuesta raw:", response.text[:500])
            
        # Cleanup
        try:
            client.files.delete(name=uploaded_file.name)
        except:
            pass

if __name__ == "__main__":
    extract_equipment()
