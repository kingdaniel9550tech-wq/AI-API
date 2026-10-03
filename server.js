const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

async function getSmartAnswer(query) {
    const lowerQ = query.toLowerCase().trim();
    
    // 1. Natural greeting recognition
    const greetings = ['hi', 'hello', 'hey', 'good evening', 'good morning', 'good afternoon', 'sup', 'dear', 'greetings', 'howdy'];
    if (greetings.some(g => lowerQ === g || lowerQ.startsWith(g + ' '))) {
        return "Hello! Dan is currently away from his desk. I am his automated assistant here to help manage inquiries. How can I assist you today?";
    }

    // 2. Try Wikipedia Summary API for fast & accurate general knowledge
    try {
        const wikiQuery = query.replace(/^(who is|what is|what's|tell me about)\s+/i, '').trim();
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`;
        const { data } = await axios.get(wikiUrl, {
            headers: { 'User-Agent': 'KingBot-AI/1.0' },
            timeout: 8000
        });

        if (data && data.extract) {
            return `${data.extract}\n\nDoes this provide the information you need, or would you like me to connect you with our human support team?`;
        }
    } catch (e) {
        // Fall back to DuckDuckGo if Wikipedia doesn't find a direct match
    }

    // 3. Try DuckDuckGo Instant Answer API as backup
    try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const { data } = await axios.get(ddgUrl, {
            headers: { 'User-Agent': 'KingBot-AI/1.0' },
            timeout: 8000
        });

        if (data && data.AbstractText) {
            return `${data.AbstractText}\n\nDoes this answer your question, or would you like to speak with an agent?`;
        }
    } catch (e) {
        // Fall back
    }

    // 4. Professional Business Concierge Fallback
    return `I have processed your inquiry regarding "${query}". While Dan is currently away, your request has been logged successfully. Would you like me to escalate this to our human support team?`;
}

app.post('/v1/chat/completions', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: { message: 'Invalid messages format' } });
        }

        const userMessage = messages[messages.length - 1].content;
        let aiResponseText = await getSmartAnswer(userMessage);

        // Append requested signature format
        aiResponseText += `\n\n_Powered by Kingbot_`;

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
    res.json({ status: 'King AI API is online and fully functional.' });
});

app.listen(PORT, () => {
    console.log(`King AI API running on port ${PORT}`);
});
