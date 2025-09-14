import React, { useState } from 'react';
import { marked } from 'marked';

// Este componente principal gestiona la lógica y la UI de la aplicación.
const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  // Maneja el cambio de archivo en el input.
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFileName(file.name);
      setChatHistory([]); // Limpia el historial de chat al subir un nuevo archivo
    } else {
      setSelectedFile(null);
      setFileName('');
      alert('Por favor, sube un archivo PDF válido.');
    }
  };

  // Maneja la subida del archivo al backend.
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona un archivo PDF para subir.');
      return;
    }

    setIsProcessing(true);
    setChatHistory([{
      sender: 'bot',
      message: 'Analizando el documento... Por favor, espera.',
      isMarkdown: false
    }]);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Reemplaza 'http://localhost:5000/upload' con la URL de tu backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setChatHistory([{
          sender: 'bot',
          message: 'Documento subido y analizado con éxito. ¡Ahora puedes hacer preguntas!',
          isMarkdown: false
        }]);
      } else {
        const errorText = await response.text();
        setChatHistory([{
          sender: 'bot',
          message: `Error al procesar el documento: ${errorText}`,
          isMarkdown: false
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatHistory([{
        sender: 'bot',
        message: 'Ocurrió un error en la conexión. Asegúrate de que el backend esté funcionando.',
        isMarkdown: false
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Maneja el envío de un mensaje de chat.
  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const newChatHistory = [...chatHistory, {
      sender: 'user',
      message: userInput,
      isMarkdown: false
    }];
    setChatHistory(newChatHistory);
    setUserInput('');
    setIsProcessing(true);

    try {
      // Reemplaza 'http://localhost:5000/chat' con la URL de tu backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userInput }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = data.response;
        setChatHistory(prevHistory => [...prevHistory, {
          sender: 'bot',
          message: botMessage,
          isMarkdown: true // El backend enviará la respuesta con formato Markdown
        }]);
      } else {
        const errorText = await response.text();
        setChatHistory(prevHistory => [...prevHistory, {
          sender: 'bot',
          message: `Error al obtener la respuesta del bot: ${errorText}`,
          isMarkdown: false
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prevHistory => [...prevHistory, {
        sender: 'bot',
        message: 'Ocurrió un error en la conexión. Asegúrate de que el backend esté funcionando.',
        isMarkdown: false
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderiza el componente.
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center p-4 font-sans antialiased">
      {/* Contenedor principal */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden h-[90vh]">
        {/* Panel de control lateral */}
        <div className="md:w-1/3 w-full bg-gray-50 p-6 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-gray-200">
          <div className="w-full flex flex-col items-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Chat de Documentos</h1>
            <p className="text-center text-gray-600 mb-8">
              Sube un documento PDF y haz preguntas a la IA sobre su contenido.
            </p>
            <div className="w-full">
              <label htmlFor="file-upload" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L6.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Seleccionar PDF
              </label>
              <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" accept="application/pdf" />
              {fileName && (
                <p className="mt-2 text-sm text-center text-gray-500 truncate">
                  Archivo seleccionado: <span className="font-medium">{fileName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 mt-6"
          >
            {isProcessing ? 'Procesando...' : 'Subir y Analizar'}
          </button>
        </div>

        {/* Panel de chat */}
        <div className="md:w-2/3 w-full p-6 flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto mb-4 p-2 space-y-4 bg-gray-50 rounded-lg">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>Sube un documento PDF para comenzar el chat.</p>
              </div>
            ) : (
              chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-xl max-w-[85%] shadow-md transition duration-300 ease-in-out transform hover:scale-[1.01] ${chat.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {chat.isMarkdown ? (
                      <div dangerouslySetInnerHTML={{ __html: marked.parse(chat.message) }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{chat.message}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Haz una pregunta sobre el documento..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              disabled={isProcessing || !fileName}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              disabled={isProcessing || !fileName}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
