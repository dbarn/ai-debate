import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit: '1mb'}));
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

const PROVIDERS = {
    anthropic: {label: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-latest'},
    gemini: {label: 'Gemini 1.5 Flash', model: 'gemini-1.5-flash'},
    openai: {label: 'ChatGPT (OpenAI gpt-4o-mini)',model: 'gpt-4o-mini'},
};

function buildUnifiedPrompt({topic, history, speakerName, extraPrompt}) {
    const transcript = history?.map((m, i) => `${i + 1}. ${m.speaker}: ${m.text}`).join('\n') || '';
    const guidance = extraPrompt?.trim() ? `\nAdditional instructions: ${extraPrompt.trim()}` : '';
    return (
        `Topic: ${topic}\n` +
        (history && history.length ? `Conversation so far:\n${transcript}\n` : '') +
        `Your role: ${speakerName}. Respond thoughtfully to progress the discussion.` +
        guidance
    );
}

async function callProvider({providerKey, prompt}) {
    if (providerKey === 'openai') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: PROVIDERS.openai.model,
                messages: [
                    {role: 'system', content: 'You are an insightful debater.'},
                    {role: 'user', content: prompt}
                ],
                temperature: 0.8
            })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`OpenAI error: ${res.status} ${txt}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || '';
    }

    if (providerKey === 'anthropic') {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: PROVIDERS.anthropic.model,
                max_tokens: 500,
                temperature: 0.8,
                messages: [{role: 'user', content: prompt}]
            })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Anthropic error: ${res.status} ${txt}`);
        }
        const data = await res.json();
        return data.content?.[0]?.text?.trim() || '';
    }

    if (providerKey === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${PROVIDERS.gemini.model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{parts: [{text: prompt}]}],
                generationConfig: {temperature: 0.8, maxOutputTokens: 500}
            })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Gemini error: ${res.status} ${txt}`);
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('')?.trim() ?? '';
        return text;
    }

    throw new Error(`Unknown provider: ${providerKey}`);
}

app.post('/api/step', async (req, res) => {
    try {
        const {engine, topic, history, extraPrompt} = req.body || {};
        if (!engine || !topic) return res.status(400).json({error: 'Missing engine or topic.'});

        const speakerName = PROVIDERS[engine].label;
        const prompt = buildUnifiedPrompt({topic, history, speakerName, extraPrompt});

        const reply = await callProvider({providerKey: engine, prompt});

        return res.json({speaker: speakerName, text: reply});
    } catch (err) {
        console.error(err);
        return res.status(500).json({error: err.message});
    }
});

app.get('/api/providers', (req, res) => {
    const list = Object.entries(PROVIDERS).map(([key, meta]) => ({key, label: meta.label}));
    res.json({providers: list});
});

app.listen(PORT, () => {
    console.log(`Server at http://localhost:${PORT}`);
});
