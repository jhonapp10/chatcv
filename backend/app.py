import os
import re
from flask import Flask, json, request, jsonify
from flask_cors import CORS
import pdfplumber
from docx import Document
import io

import requests

app = Flask(__name__)
CORS(app)

document_text = ""
profile_data = {
    "skills": [],
    "experience": [],
    "projects": []
}

# Carga los datos del CV desde un archivo JSON al iniciar el servidor
def load_cv_data_from_json():
    global profile_data
    json_path = os.path.join(os.getcwd(), 'cv_data.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            profile_data = json.load(f)
        print("Datos de CV cargados exitosamente desde cv_data.json")
    except FileNotFoundError:
        print("Error: No se encontró el archivo cv_data.json. La aplicación funcionará con datos vacíos.")
    except json.JSONDecodeError:
        print("Error: El archivo cv_data.json tiene un formato JSON incorrecto.")

load_cv_data_from_json()

# Configuración de la API de Gemini
API_KEY = "AIzaSyAGWjan0k15-XIQJ09pV-d86IJf0jJCGrc"  # Reemplaza con tu clave de API de Gemini
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" + API_KEY


def extract_cv_data(text):
    data = {
        "skills": [],
        "experience": [],
        "projects": []
    }
    
    sections = re.split(r'\n(habilidades|experiencia laboral|experiencia profesional|proyectos|skills|employment history|projects|WORK EXPERIENCE)\n', text, flags=re.IGNORECASE)
    
    current_section = None
    for section_text in sections:
        section_lower = section_text.lower().strip()
        if section_lower in ("habilidades", "skills"):
            current_section = "skills"
        elif section_lower in ("experiencia laboral", "experiencia profesional", "employment history"):
            current_section = "experience"
        elif section_lower in ("proyectos", "projects"):
            current_section = "projects"
        elif section_lower in ("WORK EXPERIENCE", "WORK EXPERIENCE"):
            current_section = "WORK EXPERIENCE"
        elif current_section:
            content = [line.strip() for line in section_text.split('\n') if line.strip()]
            if current_section == "skills":
                data["skills"] = content
            elif current_section == "experience":
                experience_entries = []
                current_job = {"title": "", "company": "", "period": "", "description": ""}
                
                # Expresión regular para detectar un nuevo puesto, buscando líneas con fechas o años.
                # Es un patrón más flexible para encontrar el título.
                job_title_pattern = re.compile(r'^\s*\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?.*')
                date_pattern = re.compile(r'(\b\d{4}\b|\b(?:Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\b)', re.IGNORECASE)
                
                for line in content:
                    line = line.strip()
                    if not line:
                        continue
                    
                    is_new_job_start = job_title_pattern.match(line) and not date_pattern.search(line)
                    is_period_line = date_pattern.search(line)
                    
                    if is_new_job_start:
                        if current_job["title"]:
                            experience_entries.append(current_job)
                        current_job = {"title": line, "company": "", "period": "", "description": ""}
                    elif is_period_line and current_job["title"]:
                        current_job["period"] = line
                    elif current_job["title"]:
                        # Asume que las líneas de descripción siguen al título y periodo
                        current_job["description"] += " " + line
                
                if current_job["title"]:
                    experience_entries.append(current_job)
                
                data["experience"] = experience_entries
            elif current_section == "projects":
                data["projects"] = content
            
            current_section = None

    return data

@app.route('/get_cv_data', methods=['GET'])
def get_cv_data():
    """Endpoint para que el frontend obtenga los datos del CV."""
    return jsonify({"profile_data": profile_data})

@app.route('/upload', methods=['POST'])
def upload_file():
    global document_text, profile_data
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filename = file.filename
    document_text = ""

    if filename.endswith('.pdf'):
        with pdfplumber.open(file.stream) as pdf:
            for page in pdf.pages:
                document_text += page.extract_text() or ""
    elif filename.endswith('.docx'):
        doc = Document(io.BytesIO(file.read()))
        for para in doc.paragraphs:
            document_text += para.text + '\n'
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    profile_data = extract_cv_data(document_text)
    return jsonify({"message": "File uploaded successfully", "profile_data": profile_data})

@app.route('/chat', methods=['POST'])
def chat_with_doc():
    """Endpoint para manejar las preguntas del chat."""
    data = request.json
    query = data.get('query', '').lower()
    
    if not API_KEY or API_KEY == "YOUR_API_KEY_HERE":
        return jsonify({"response": "La clave de la API de Gemini no está configurada en el servidor. Por favor, añádela en app.py."})

    # Construye el prompt para el modelo de Gemini
    system_instruction = (
        "Actúa como un agente de chat profesional que responde preguntas sobre un currículum. "
        "Responde de manera concisa y utiliza la información proporcionada. "
        "Si la información no está disponible, responde que no la puedes encontrar en el documento."
    )
    user_prompt = (
        f"Aquí está el contenido de un currículum en formato JSON: {json.dumps(profile_data, indent=2)}\n\n"
        f"Pregunta del usuario: {query}"
    )

    payload = {
        "contents": [{"parts": [{"text": user_prompt}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "tools": [{"google_search": {}}]
    }

    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status() # Lanza un error para códigos de estado HTTP 4xx/5xx
        gemini_response = response.json()
        
        # Extrae el texto de la respuesta del modelo
        response_text = gemini_response.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No se pudo obtener una respuesta.")
        
        return jsonify({"response": response_text})
        
    except requests.exceptions.RequestException as e:
        print(f"Error al llamar a la API de Gemini: {e}")
        return jsonify({"response": "Lo siento, hubo un problema al comunicarse con el servicio de IA."})
    except (IndexError, KeyError) as e:
        print(f"Error al analizar la respuesta de la API: {e}")
        return jsonify({"response": "Error al procesar la respuesta de la IA. Inténtalo de nuevo."})


if __name__ == '__main__':
    app.run(debug=True)
