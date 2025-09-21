import os
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

API_KEY = os.environ.get("GEMINI_API_KEY")

app = Flask(__name__, static_folder='../frontend/document-chat-app/build', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})
#CORS(app)

# Cargar los datos del CV desde el archivo JSON
def load_cv_data():
    try:
        with open('cv_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: El archivo 'cv_data.json' no se encuentra.")
        return None

cv_data = load_cv_data()

# Rutas para servir la aplicación de React
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(app.static_folder, 'static'), filename)

@app.route('/asset-manifest.json')
def serve_manifest():
    return send_from_directory(app.static_folder, 'asset-manifest.json')

# Endpoint para obtener los datos del CV
@app.route('/get_cv_data')
def get_cv_data():
    if cv_data:
        return jsonify(profile_data=cv_data)
    else:
        return jsonify({"error": "No se pudieron cargar los datos del CV"}), 500

# Endpoint del chat
@app.route('/chat', methods=['POST'])
def chat():
    user_query = request.json.get('query')
    if not user_query:
        return jsonify({"error": "No se recibió la consulta del usuario."}), 400

    if not cv_data:
        return jsonify({"error": "Los datos del CV no están disponibles."}), 500

    # Configuración para la API de Gemini
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" + API_KEY
    headers = {'Content-Type': 'application/json'}

    # Instrucciones para el modelo de IA
    system_instruction = (
        "Actúa como un agente profesional y experto en reclutamiento. Responde a las preguntas "
        "únicamente basándote en la información proporcionada en el siguiente CV, que está en "
        "formato JSON. No inventes información. Si no tienes la respuesta, di que la información "
        "no se encuentra en el currículum. Responde de manera concisa y profesional. "
        "Asegúrate de que las respuestas sean útiles para un reclutador."
    )

    # El contenido completo del CV se pasa al modelo
    data_for_api = {
        "contents": [
            {
                "parts": [
                    {"text": system_instruction},
                    {"text": f"Información del CV: {json.dumps(cv_data)}"},
                    {"text": f"Pregunta del usuario: {user_query}"}
                ]
            }
        ],
        "tools": [
            {"google_search": {}}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data_for_api)
        response.raise_for_status()
        gemini_response = response.json()
        print("Gemini response:", gemini_response)  # 👈 DEBUG EN LOGS

        text_response = gemini_response['candidates'][0]['content']['parts'][0]['text']
        return jsonify({"response": text_response})

    except Exception as e:
        print("Error en /chat:", e)
        return jsonify({"error": str(e)}), 500


    #try:
     #   response = requests.post(url, headers=headers, json=data_for_api)
     #   response.raise_for_status()
     #   gemini_response = response.json()
        
        # Extraer la respuesta de texto del modelo
     #   text_response = gemini_response['candidates'][0]['content']['parts'][0]['text']
     #   return jsonify({"response": text_response})

    #except requests.exceptions.RequestException as e:
    #    print(f"Error de solicitud a Gemini: {e}")
    #    return jsonify({"error": "Error al comunicarse con el modelo de IA."}), 500
    #except (KeyError, IndexError) as e:
    #    print(f"Error al analizar la respuesta de Gemini: {e}")
    #    return jsonify({"error": "Error en el formato de la respuesta del modelo de IA."}), 500

if __name__ == '__main__':
    app.run()