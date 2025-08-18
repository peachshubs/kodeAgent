import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'

dotenv.config();

const app = express();

//middleware
// makes cross-origin requests and enable server calling from frontend
app.use(cors({
    origin: "http://localhost:5173", // allow your Vite frontend
    methods: ["GET", "POST"]
}));
// passes front end to the backend
app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send({
        message: "Kode says Hi!"
    })
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral",
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Something went wrong: ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        res.json({ bot: data.response });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ 
            error: "Failed to generate response",
            details: error.message 
        });
    }
});

// Streaming endpoint for real-time responses
app.post('/stream', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral",
                prompt: prompt,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Something went wrong: ${response.status}: ${response.statusText}`);
        }

        let fullResponse = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        fullResponse += data.response;
                    }
                    if (data.done) {
                        return res.json({ bot: fullResponse });
                    }
                } catch (parseError) {
                    console.log('Parse error for line:', line);
                }
            }
        }
        
        res.json({ bot: fullResponse });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ 
            error: "Failed to generate response",
            details: error.message 
        });
    }
});

// Endpoint to check available models
app.get('/models', async (req, res) => {
    try {
        const response = await fetch("http://localhost:11434/api/tags");
        
        if (!response.ok) {
            throw new Error(`Something went wrong: ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching models:", error);
        res.status(500).json({ 
            error: "Failed to fetch models",
            details: error.message 
        });
    }
});

// Endpoint to use different models
app.post('/chat/:model', async (req, res) => {
    try {
        const { model } = req.params;
        const prompt = req.body.prompt;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Something went wrong: ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({ bot: data.response, model: model });
    } catch (error) {
        console.error(`Error with model ${req.params.model}:`, error);
        res.status(500).json({ 
            error: "Failed to generate response",
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});