import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "EMPTY",
  baseURL: "http://173.208.243.146:8000/v1",
});

export async function getChatCompletion(systemMessage, messages) {
  // messages: array of { role: 'user'|'bot', content: '...' }
  const formattedMessages = [
    { role: "system", content: systemMessage },
    ...messages.map((msg) => ({
      role: msg.role === "human" || msg.role === "user" ? "user" : "assistant",
      content: msg.content, // <-- use content, not text
    })),
  ];

  return client.chat.completions.create({
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    messages: formattedMessages,
    max_tokens: 512,
  });
}
