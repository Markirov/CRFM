import fitz
import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

PDF_DIR = r"E:\Drive\CBT\CFRM-firebase\herramientas\PDFs"
API_KEY = os.getenv("GEMINI_API_KEY")

def extract_all_tocs():
    all_tocs = {}
    for filename in os.listdir(PDF_DIR):
        if filename.endswith(".pdf"):
            path = os.path.join(PDF_DIR, filename)
            try:
                doc = fitz.open(path)
                toc = doc.get_toc()
                all_tocs[filename] = toc
                print(f"Extracted TOC from {filename} ({len(toc)} entries)")
            except Exception as e:
                print(f"Error reading {filename}: {e}")
    return all_tocs

def generate_taxonomy(all_tocs):
    if not API_KEY:
        print("Error: GEMINI_API_KEY no encontrada en el .env")
        return

    client = genai.Client(api_key=API_KEY)
    
    # Preparamos el TOC como texto para pasárselo a la IA
    toc_text = ""
    for book, toc in all_tocs.items():
        toc_text += f"\n\n--- BOOK: {book} ---\n"
        # Para no saturar el prompt con 5000 lineas, pasamos solo los niveles 1, 2 y 3
        for entry in toc:
            lvl, title, page = entry
            if lvl <= 3:
                toc_text += f"{'  ' * (lvl-1)}- {title}\n"

    prompt = f"""
    Eres un experto arquitecto de información y Game Master de BattleTech.
    A continuación te proporciono los Índices (TOC) de los 6 manuales principales de BattleTech.
    Tu objetivo es fusionarlos lógicamente y diseñar una "Taxonomía Maestra Temática" (un Árbol de Categorías) para una Wiki de Reglas.

    En lugar de organizarlo por libros, organízalo por temas de juego (Ej: Movimiento, Combate, Armas, Vehículos, Campañas, Mechs...).
    No incluyas lore, universo o introducciones. Céntrate en reglas y mecánicas.

    Devuelve el resultado estrictamente como un array JSON válido, donde cada categoría tenga un 'name' y un array de 'subcategories' (strings).
    Ejemplo:
    [
      {{ "name": "Combate", "subcategories": ["Ataques Físicos", "Ataques con Armas", "Calor", "Daño y Críticos"] }},
      {{ "name": "Armas", "subcategories": ["Energía", "Balística", "Misiles", "Cuerpo a Cuerpo"] }}
    ]

    TOC de los libros:
    {toc_text}
    """

    print("Enviando TOCs a Gemini (modelo gemini-2.5-pro)...")
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    try:
        data = json.loads(response.text)
        with open('wiki-tree.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("\n¡Taxonomía generada exitosamente en wiki-tree.json!")
    except Exception as e:
        print(f"Error parseando JSON: {e}\nRespuesta pura:\n{response.text}")

if __name__ == "__main__":
    tocs = extract_all_tocs()
    generate_taxonomy(tocs)
