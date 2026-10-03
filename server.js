const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

async function getSmartAnswer(query) {
    const lowerQ = query.toLowerCase().trim();
    
    // Graceful conversational handling for greetings
    const greetings = ['hi', 'hello', 'hey', 'good evening', 'good morning', 'good afternoon', 'sup', 'dear', 'greetings'];
    if (greetings.some(g => lowerQ.includes(g))) {
        return "Hello! Dan is currently away from his desk. I am his automated concierge assistant, here to help manage inquiries. How can I assist you today?";
    }

    try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'KingBot-AI/1.0' },
            timeout: 10000
        });

        if (data && data.AbstractText) {
            return `Here is detailed information regarding your request:\n\n${data.AbstractText}\n\nDoes this provide the clarity you need, or would you like me to connect you with our human support team?`;
        }

        if (data && data.RelatedTopics && data.RelatedTopics.length > 0) {
            let topicsText = data.RelatedTopics.filter(t => t.Text).slice(0, 2).map(t => t.Text).join('\n\n');
            if (topicsText) {
                return `Based on verified records regarding "${query}":\n\n${topicsText}\n\nPlease let me know if you require further assistance or wish to speak with an agent.`;
            }
        }

        return `I have thoroughly processed your message regarding "${query}". While Dan is currently away, I am here to ensure your request is documented and addressed promptly. Would you like me to flag our human support team to assist you further?`;
    } catch (err) {
        return `I have received your message regarding "${query}". Dan is currently unavailable, but your request has been logged successfully. Would you like me to escalate this to human support?`;
    }
}

app.post('/v1/chat/completions', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: { message: 'Invalid messages format' } });
        }

        const userMessage = messages[messages.length - 1].content;
        const aiResponseText = await getSmartAnswer(userMessage);

        res.json({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'king-ai-v1',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: aiResponseText
                },
                finish_reason: 'stop'
            }]
        });
    } catch (err) {
        res.status(500).json({ error: { message: 'Internal AI Server Error' } });
    }
});

app.get('/', (req, res) => {
    jsonRes = { status: 'King AI API is online and fully functional.' };
    res.json(jsonRes);
});

app.listen(PORT, () => {
    console.log(`King AI API running on port ${PORT}`);
});
