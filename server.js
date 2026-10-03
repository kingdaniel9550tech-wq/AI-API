const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Reliable Knowledge Fetcher using DuckDuckGo's Official JSON API
async function getSmartAnswer(query) {
    try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'KingBot-AI/1.0' },
            timeout: 10000
        });

        // If DuckDuckGo has an official abstract summary, return it directly
        if (data && data.AbstractText) {
            return data.AbstractText;
        }

        // Check related topics if available
        if (data && data.RelatedTopics && data.RelatedTopics.length > 0) {
            for (let topic of data.RelatedTopics) {
                if (topic.Text) return topic.Text;
            }
        }

        // Graceful business concierge response if no direct encyclopedia entry exists
        return `I am Dan's automated business assistant. Regarding "${query}", Dan is currently away, but I have noted your request and ensured it will be attended to shortly!`;
    } catch (err) {
        console.error('API Search Error:', err.message);
        return `Hello! I am Dan's automated assistant. I have received your message regarding "${query}" and will make sure Dan gets back to you as soon as possible.`;
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
        console.error('Server Error:', err.message);
        res.status(500).json({ error: { message: 'Internal AI Server Error' } });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'King AI API is online and fully functional dear.' });
});

app.listen(PORT, () => {
    console.log(`King AI API running on port ${PORT}`);
});
