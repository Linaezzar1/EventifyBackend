const axios = require('axios');
const Event = require('../models/Event');
const Task = require('../models/Task');
const User = require('../models/User');

// API Groq - Ultra rapide et gratuite
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Instructions système pour le chatbot
const SYSTEM_CONTEXT = `Tu t'appelles EventBot, l'assistant virtuel intelligent d'Eventify.

 TON RÔLE EXCLUSIF :
Tu es UNIQUEMENT spécialisé dans l'aide à l'organisation d'événements universitaires et associatifs via l'application Eventify.

 TU PEUX AIDER AVEC :
- Création et planification d'événements (conférences, festivals, séminaires, clubs)
- Gestion des inscriptions des participants
- Coordination du staff et attribution des tâches
- Stratégies de communication et promotion sur campus
- Logistique (lieux, matériel, budget)
- Notifications et rappels
- Suivi du tableau RH
- Conseils selon les rôles : Organisateur, Logistique, Communication, Participant

 TU NE RÉPONDS PAS à :
- Questions sur le sport, politique, cuisine, ou tout sujet hors organisation d'événements
- Questions générales sans lien avec Eventify

 INSTRUCTIONS :
- Réponds UNIQUEMENT sur l'organisation d'événements avec Eventify
- Sois concis, pratique et en français
- Si on te pose une question hors sujet, réponds : "Je suis EventBot, assistant d'Eventify. Je ne peux aider qu'avec l'organisation d'événements universitaires et associatifs. Comment puis-je vous assister dans vos événements ?"
- Présente-toi si on te salue : "Bonjour ! Je suis EventBot, votre assistant Eventify. Je vous aide à organiser vos événements universitaires et associatifs. Comment puis-je vous aider ?"`;


// Fonction de fallback avec des réponses adaptées à Eventify
function getFallbackResponse(message, userRole = 'participant', events = [], tasks = []) {
    const lowerMessage = message.toLowerCase();
    
    // Réponses contextuelles basées sur les données utilisateur
    if (lowerMessage.includes('mes événements') || lowerMessage.includes('mes events')) {
        if (events.length > 0) {
            return `Vous avez ${events.length} événement(s) : ${events.map(e => e.title).join(', ')}. Que souhaitez-vous savoir sur ces événements ?`;
        }
        return "Vous n'avez pas encore d'événements. En tant que " + userRole + ", vous pouvez " + 
               (userRole === 'organisateur' ? "créer de nouveaux événements depuis l'onglet Événements." : "vous inscrire aux événements disponibles.");
    }
    
    if (lowerMessage.includes('mes tâches') || lowerMessage.includes('mes tasks')) {
        const pendingTasks = tasks.filter(t => t.status !== 'fait');
        if (pendingTasks.length > 0) {
            return `Vous avez ${pendingTasks.length} tâche(s) en cours. Consultez l'onglet Tâches & Staff pour voir les détails.`;
        }
        return "Excellent ! Vous n'avez aucune tâche en attente.";
    }
    
    // Conseils spécifiques par rôle
    if (lowerMessage.includes('mon rôle') || lowerMessage.includes('que puis-je faire')) {
        switch(userRole) {
            case 'organisateur':
                return "En tant qu'Organisateur, vous pouvez : créer des événements, gérer les inscriptions, assigner des tâches au staff, envoyer des notifications et suivre le tableau RH.";
            case 'logistique':
                return "En tant que Logistique, vous gérez : les lieux, le matériel, les ressources et la coordination avec les fournisseurs.";
            case 'communication':
                return "En tant que Communication, vous gérez : la promotion des événements, les notifications et l'engagement des participants.";
            default:
                return "En tant que Participant, vous pouvez consulter les événements, vous inscrire et recevoir des notifications.";
        }
    }
    
    // Salutations - UNIQUEMENT si le message est une salutation pure
    const greetings = ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'hi'];
    const isGreeting = greetings.some(g => {
        const words = lowerMessage.trim().split(' ');
        return words.length <= 2 && words.some(w => w.includes(g));
    });
    
    if (isGreeting) {
        return "Bonjour ! Je suis EventBot 🤖, votre assistant personnel Eventify. Je suis là pour vous aider à organiser des événements universitaires et associatifs exceptionnels. Que souhaitez-vous créer aujourd'hui ?";
    }
    
    if (lowerMessage.includes('qui es-tu') || lowerMessage.includes('qui es tu') || lowerMessage.includes('présente-toi') || lowerMessage.includes('ton nom')) {
        return "Je m'appelle EventBot 🤖, l'assistant intelligent d'Eventify ! Ma mission : vous aider à organiser des événements universitaires et associatifs réussis. Je vous conseille sur la planification, la logistique, la communication et la gestion de votre équipe. Comment puis-je vous assister ?";
    }
    
    if (lowerMessage.includes('merci')) {
        return "Avec grand plaisir ! Je suis EventBot, toujours là pour vos événements. N'hésitez pas à revenir me voir ! 🎓✨";
    }
    
    // Détection questions hors sujet
    const offTopicKeywords = ['sport', 'foot', 'real', 'barca', 'barcelone', 'match', 'cuisine', 'recette', 'politique', 'météo', 'actualité'];
    if (offTopicKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return "Je suis EventBot, assistant d'Eventify 🎯. Je me concentre uniquement sur l'organisation d'événements universitaires et associatifs. Pour des questions sur d'autres sujets, je vous invite à utiliser un autre assistant. Comment puis-je vous aider avec vos événements ?";
    }
    
    // Aide générale
    if (lowerMessage.includes('aide') || lowerMessage.includes('help') || lowerMessage.includes('comment')) {
        return "Je suis EventBot 🤖, votre guide Eventify ! Je peux vous aider avec :\n\n📅 Vos événements et inscriptions\n✅ Vos tâches et le staff\n📢 Communication et promotion\n📦 Logistique et budget\n👥 Coordination d'équipe\n🔔 Notifications et rappels\n\nPosez-moi une question spécifique sur votre événement !";
    }
    
    // Réponse par défaut personnalisée
    return `Je suis EventBot, votre assistant Eventify. En tant que ${userRole}, je peux vous guider sur l'organisation d'événements universitaires et associatifs. Posez-moi des questions sur la création d'événements, les inscriptions, la gestion du staff, la logistique ou la communication ! 🎉`;
}

exports.chatWithBot = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: 'Le message est requis' });
        }

        const user = await User.findById(userId).select('name role');
        const userEvents = await Event.find({ 
            $or: [{ createdBy: userId }, { participants: userId }]
        }).limit(5).select('title date location');
        
        const userTasks = await Task.find({ assignedTo: userId })
            .limit(5)
            .select('title status dueDate');

        // Construit le contexte utilisateur
        let userContext = `Utilisateur: ${user.name}, Rôle: ${user.role}`;
        if (userEvents.length > 0) {
            userContext += `, Événements: ${userEvents.map(e => e.title).join(', ')}`;
        }
        if (userTasks.length > 0) {
            const pending = userTasks.filter(t => t.status !== 'fait').length;
            userContext += `, Tâches en cours: ${pending}`;
        }

        // Essaie d'utiliser Groq API (ultra-rapide et gratuit)
        try {
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model: 'llama-3.1-8b-instant', // Très rapide et gratuit
                    messages: [
                        { role: 'system', content: SYSTEM_CONTEXT },
                        { role: 'user', content: `${userContext}\n\nQuestion: ${message}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                const botResponse = response.data.choices[0].message.content.trim();
                if (botResponse.length > 10) {
                    return res.json({
                        response: botResponse,
                        conversationId: Date.now(),
                        source: 'ai-groq',
                        userContext: {
                            role: user.role,
                            eventsCount: userEvents.length,
                            pendingTasksCount: userTasks.filter(t => t.status !== 'fait').length
                        }
                    });
                }
            }
        } catch (aiError) {
            console.log('Groq API indisponible:', aiError.response?.data?.error?.message || aiError.message);
        }

        // Fallback: utilise les réponses prédéfinies
        const botResponse = getFallbackResponse(message, user.role, userEvents, userTasks);

        res.json({
            response: botResponse,
            conversationId: Date.now(),
            source: 'local',
            userContext: {
                role: user.role,
                eventsCount: userEvents.length,
                pendingTasksCount: userTasks.filter(t => t.status !== 'fait').length
            }
        });

    } catch (error) {
        console.error('Erreur chatbot:', error.message);
        res.status(500).json({ error: 'Erreur lors du traitement du message' });
    }
};

exports.chatSimple = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        
        if (!message) {
            return res.status(400).json({ error: 'Le message est requis' });
        }

        const user = await User.findById(userId).select('name role');
        const userEvents = await Event.find({ 
            $or: [{ createdBy: userId }, { participants: userId }]
        }).limit(5).select('title date location');
        
        const userTasks = await Task.find({ assignedTo: userId })
            .limit(10)
            .select('title status dueDate');

        const response = getFallbackResponse(message, user.role, userEvents, userTasks);
        
        res.json({
            response: response,
            mode: 'local',
            userContext: {
                name: user.name,
                role: user.role,
                eventsCount: userEvents.length,
                pendingTasksCount: userTasks.filter(t => t.status !== 'fait').length
            }
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur lors du traitement du message' });
    }
};
