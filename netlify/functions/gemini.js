exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY; 
        
        // 🌟 DIAGNOSTIC 1: Check the Vault
        console.log("1. Did we get the prompt? YES. Prompt:", prompt);
        if (!API_KEY) {
            console.log("🚨 ERROR: The API key is missing from the Netlify Vault!");
            throw new Error("Missing API Key");
        } else {
            console.log("2. The API key was successfully found in the Vault.");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        const data = await response.json();

        // 🌟 DIAGNOSTIC 2: See exactly what Google says!
        console.log("3. Google replied with:", JSON.stringify(data));

        if (!response.ok) {
            throw new Error("Google API rejected the request.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        // 🌟 DIAGNOSTIC 3: Print the exact crash reason
        console.error("🚨 CRITICAL ERROR:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: "Backend error" }) };
    }
};
