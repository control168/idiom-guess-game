const https = require('https');
require('dotenv').config({ path: '.env' });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('Error: GOOGLE_API_KEY not found in .env');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.error) {
                console.error('API Error:', response.error);
            } else {
                console.log('Available Models:');
                if (response.models) {
                    response.models.forEach(model => {
                        console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
                    });
                } else {
                    console.log('No models found in response.');
                }
            }
        } catch (e) {
            console.error('Error parsing response:', e);
            console.log('Raw response:', data);
        }
    });
}).on('error', (e) => {
    console.error('Request error:', e);
});
