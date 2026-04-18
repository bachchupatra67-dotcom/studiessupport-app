// 🌟 THE FIX: Tell Vercel to wait up to 60 seconds for the AI instead of 10!
export const maxDuration = 60; 

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Check if Vercel has the key
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing in Vercel Environment Variables' });
    }

    try {
        let parts = [];

        if (prompt) {
            parts.push({ text: prompt });
        } else {
            parts.push({ text: "Please analyze this and explain it simply." });
        }

        // 2. Exact syntax Google requires for Images (inlineData, mimeType)
        if (image) {
            parts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: image
                }
            });
        }

        // 3. Using your specific gemini-2.5-flash model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: parts }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Gemini API');
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
