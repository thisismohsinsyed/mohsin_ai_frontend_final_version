import { getChatCompletion } from "../services/llmService/llmService.js";

export async function handleChat(req, res) {
  try {
    // Get user input and system message from request body
    const systemMessage = req.body.systemMessage || "You are a helpful assistant that provides concise and clear answers.";
    const userMessage= req.body.messages || [];

      console.log("userMessag:", userMessage)
      console.log("systemMessage:", systemMessage)

    const completion = await getChatCompletion(systemMessage, userMessage);

    res.json({
      success: true,
      message: completion.choices[0]?.message?.content || "",
    });
  } catch (error) {
    console.error("Error in LLM controller:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
