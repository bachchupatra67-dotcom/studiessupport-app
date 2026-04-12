export default async function handler(req, res) {
    // 1. Only allow secure POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Get the student's question (Vercel parses this automatically!)
        const { prompt } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("🚨 ERROR: Missing API Key in Vercel Vault");
            return res.status(500).json({ error: 'API Key missing' });
        }

        // 3. Ask Gemini 2.5 Flash securely
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("🚨 Google API Error:", data);
            return res.status(500).json({ error: 'Google API rejected the request.' });
        }

        // 4. Send the answer back to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error("🚨 CRITICAL ERROR:", error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
