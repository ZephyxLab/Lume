// Configuración del chatbot
const config = {
    name: 'Lume',
    greeting: '¡Hola! Soy Lume. ¿En qué puedo ayudarte hoy?',
    farewell: 'Gracias por hablar conmigo. ¡Que tengas un gran día!',
    unknownResponse: 'Lo siento, no entiendo completamente. ¿Podrías reformular tu pregunta?'
};

let corpus = [];
let conversationContext = '';

// Cargar el corpus desde el archivo
async function loadCorpus() {
    try {
        const response = await fetch('corpus.txt');
        const text = await response.text();
        const lines = text.split('\n');
        for (let line of lines) {
            const [question, answer] = line.split('|').map(str => str.trim());
            if (question && answer) {
                corpus.push({ 
                    question: question.toLowerCase(), 
                    answer, 
                    keywords: extractKeywords(question)
                });
            }
        }
        console.log('Corpus cargado exitosamente');
    } catch (error) {
        console.error('Error al cargar el corpus:', error);
    }
}

// Extraer palabras clave de una frase
function extractKeywords(phrase) {
    const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 'en', 'a', 'de', 'con', 'por', 'para', 'como', 'que', 'me', 'te', 'se', 'lo', 'le', 'tu', 'su', 'mi', 'es', 'son'];
    return phrase.toLowerCase()
                 .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                 .split(/\s+/)
                 .filter(word => word.length > 2 && !stopWords.includes(word));
}

// Obtener respuesta basada en la entrada del usuario
function getResponse(input) {
    const userKeywords = extractKeywords(input);
    let bestMatch = null;
    let highestScore = 0;

    for (const entry of corpus) {
        const score = calculateMatchScore(userKeywords, entry.keywords);
        if (score > highestScore) {
            highestScore = score;
            bestMatch = entry;
        }
    }

    if (bestMatch && highestScore > 0.4) { // Reducido el umbral para mayor flexibilidad
        conversationContext = bestMatch.question;
        return bestMatch.answer;
    } else if (conversationContext) {
        // Intentar encontrar una respuesta relacionada con el contexto anterior
        const contextualResponse = getContextualResponse(input);
        if (contextualResponse) return contextualResponse;
    }

    conversationContext = '';
    return getDefaultResponse(input);
}

// Calcular puntuación de coincidencia entre palabras clave
function calculateMatchScore(userKeywords, entryKeywords) {
    const matchingKeywords = userKeywords.filter(keyword => 
        entryKeywords.some(entryKeyword => 
            entryKeyword.includes(keyword) || keyword.includes(entryKeyword)
        )
    );
    return matchingKeywords.length / Math.max(userKeywords.length, entryKeywords.length);
}

// Obtener respuesta contextual basada en la conversación anterior
function getContextualResponse(input) {
    const contextEntries = corpus.filter(entry => 
        entry.question.toLowerCase().includes(conversationContext.toLowerCase())
    );
    if (contextEntries.length > 0) {
        const userKeywords = extractKeywords(input);
        let bestContextMatch = null;
        let highestContextScore = 0;

        for (const entry of contextEntries) {
            const score = calculateMatchScore(userKeywords, entry.keywords);
            if (score > highestContextScore) {
                highestContextScore = score;
                bestContextMatch = entry;
            }
        }

        if (bestContextMatch && highestContextScore > 0.3) {
            return bestContextMatch.answer;
        }
    }
    return null;
}

// Obtener respuesta predeterminada o generada
function getDefaultResponse(input) {
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches'];
    const farewells = ['adiós', 'hasta luego', 'chao', 'nos vemos'];

    if (greetings.some(greeting => input.toLowerCase().includes(greeting))) {
        return config.greeting;
    } else if (farewells.some(farewell => input.toLowerCase().includes(farewell))) {
        return config.farewell;
    }

    return generateResponse(input);
}

// Generar una respuesta basada en la entrada del usuario
function generateResponse(input) {
    const responses = [
        `Interesante pregunta sobre "${input}". Déjame investigar más y te daré una respuesta más completa en breve.`,
        `"${input}" es un tema fascinante. ¿Podrías darme más detalles sobre qué aspecto te interesa más?`,
        `No tengo información específica sobre "${input}", pero puedo ayudarte a buscar fuentes confiables si lo deseas.`,
        `Tu pregunta sobre "${input}" es muy buena. ¿Te gustaría que exploráramos juntos este tema?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Inicializar el chatbot
async function initializeBot() {
    await loadCorpus();
    addMessage('bot', config.greeting);
}

// Manejar el envío de mensajes
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        addMessage('user', message);
        const typingIndicator = showTypingIndicator();

        setTimeout(() => {
            const response = getResponse(message);
            hideTypingIndicator(typingIndicator);
            addMessage('bot', response);
            messageInput.value = '';
        }, Math.random() * 1000 + 500); // Tiempo de respuesta aleatorio entre 0.5 y 1.5 segundos
    }
}

// Agregar mensaje al chat
function addMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mostrar el indicador de "generando"
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator active';
    typingIndicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingIndicator;
}

// Ocultar el indicador de "generando"
function hideTypingIndicator(typingIndicator) {
    typingIndicator.remove();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeBot);
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
