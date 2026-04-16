// Test OpenRouter API Key directly
const API_KEY = "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";
const BASE_URL = "https://openrouter.ai/api/v1";
const MODELS = [
  "openai/gpt-3.5-turbo",
  "meta-llama/llama-3-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "openchat/openchat-3.5:free"
];

console.log("Testing OpenRouter Free Models...\n");

if (!API_KEY) {
  console.error("❌ Error: API_KEY not provided");
  process.exit(1);
}

for (const MODEL of MODELS) {
  try {
    console.log(`Testing: ${MODEL}...`);
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "user", content: "Hello, are you working?" },
        ],
        max_tokens: 30,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data.error?.message || JSON.stringify(data);
      console.log(`  ❌ Error: ${error}\n`);
      continue;
    }

    const message = data.choices?.[0]?.message?.content;
    console.log(`  ✅ Working! Response: "${message}"\n`);
  } catch (error) {
    console.log(`  ⚠️  Network Error: ${error.message}\n`);
  }
}

console.log("Test complete!");
