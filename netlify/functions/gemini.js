exports.handler = async function(event, context) {
    // 1. Only allow secure POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 2. Get the student's question from the frontend
        const { prompt } = JSON.parse(event.body);
        
        // 3. Grab the secret key from the Netlify Vault
        const API_KEY = process.env.GEMINI_API_KEY; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // 4. Ask the AI the question securely
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        const data = await response.json();

        // 5. Send the answer back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Backend error" }) };
    }
};
