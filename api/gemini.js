export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing in Vercel Environment Variables' });
    }

    try {
        let parts = [];

        // 🌟 1. Always add the text prompt (whether they typed it, or we use a default)
        if (prompt) {
            parts.push({ text: prompt });
        } else {
            parts.push({ text: "Please analyze this and solve it step by step." });
        }

        // 🌟 2. If the user snapped a photo, attach the image data!
        if (image) {
            parts.push({
                inline_data: {
                    mime_type: "image/jpeg", // Gemini accepts this generic type for base64 images
                    data: image
                }
            });
        }

        // 🌟 3. Call the Gemini 2.5 Flash Model!
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: parts }]
            })
        });

        const data = await response.json();

        // Catch any errors from Google
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Gemini API');
        }

        // Send the AI's answer back to the student's phone
        return res.status(200).json(data);

    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
