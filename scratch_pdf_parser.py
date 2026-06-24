import fitz  # PyMuPDF
import sys
import re

def extract_toc(pdf_path):
    doc = fitz.open(pdf_path)
    toc = doc.get_toc()
    print(f"TOC for {pdf_path}:")
    for level, title, page in toc:
        if any(keyword in title.lower() for keyword in ['maintenance', 'repair', 'mantenimiento', 'reparación', 'salvage', 'customization', 'cost', 'scaveng']):
            print(f"Level {level}: {title} (Page {page})")
    doc.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_toc(sys.argv[1])
    else:
        print("Usage: python pdf_parser.py <pdf_path>")
