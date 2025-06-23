
import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { ImagePart } from "../types"; // Import ImagePart

let geminiClient: GoogleGenAI | null = null;

export const initializeGeminiClient = (apiKey: string): boolean => {
  if (!apiKey || !apiKey.startsWith('AIza')) { 
    if (geminiClient) { 
        geminiClient = null;
    }
    return false;
  }
  try {
    geminiClient = new GoogleGenAI({ apiKey });
    return true;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI with provided key:", error);
    geminiClient = null;
    return false;
  }
};

export const isGeminiClientInitialized = (): boolean => !!geminiClient;

// Non-streaming version (kept for potential specific uses or fallback)
export const generateGeminiClientResponse = async (userQuery: string, systemInstructionString: string): Promise<string> => {
  if (!geminiClient) {
    throw new Error("Gemini AI SDK not initialized or API key is invalid. Please configure it in settings.");
  }

  try {
    const response: GenerateContentResponse = await geminiClient.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: userQuery }] }],
      config: {
        systemInstruction: { role: "system", parts: [{ text: systemInstructionString }] },
        temperature: 0.8,
        maxOutputTokens: 2048,
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      }
    });
    
    const textContent = response.text;
    if (typeof textContent === 'string') {
        return textContent;
    } else {
        console.error('Gemini API response.text was not a string. Full response:', JSON.stringify(response, null, 2));
        if (response?.promptFeedback?.blockReason) {
            throw new Error(`Prompt was blocked. Reason: ${response.promptFeedback.blockReason}${response.promptFeedback.blockReasonMessage ? ' - ' + response.promptFeedback.blockReasonMessage : ''}`);
        }
        const candidate = response?.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            const safetyRatings = candidate.safetyRatings;
            let blockedCategories = safetyRatings?.filter(r => r.probability !== 'NEGLIGIBLE' && r.probability !== 'LOW').map(r => r.category.replace('HARM_CATEGORY_', '')).join(', ');
            throw new Error(`Response blocked by safety filters. Categories: ${blockedCategories || 'Content policy'}.`);
        }
        if (candidate?.finishReason === 'OTHER' || candidate?.finishReason === 'RECITATION' || !candidate) {
             throw new Error(`Gemini API returned an empty or malformed response. Reason: ${candidate?.finishReason || 'Unknown/No Candidate'}.`);
        }
        throw new Error('Gemini API returned an invalid or unexpected text response structure.');
    }
  } catch (error) {
    console.error("Error calling Gemini API (non-streaming):", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("permission_denied")) {
        throw new Error("The provided Gemini API key is invalid or lacks permissions. Please check it in settings.");
    }
    throw error; 
  }
};

// Streaming version
export async function* generateGeminiClientResponseStream(
  userQueryOrPrompt: string, // Can be a user query or a specific vision prompt
  systemInstructionString: string,
  imageParts?: ImagePart[] // Optional image parts for multimodal input
): AsyncIterable<GenerateContentResponse> {
  if (!geminiClient) {
    throw new Error("Gemini AI SDK not initialized. Please configure it in settings.");
  }

  // Construct parts: include image parts first if they exist, then text part.
  const queryParts = [];
  if (imageParts && imageParts.length > 0) {
    queryParts.push(...imageParts);
  }
  queryParts.push({ text: userQueryOrPrompt });

  try {
    const stream = await geminiClient.models.generateContentStream({
        model: GEMINI_MODEL_NAME, // gemini-2.5-flash-preview-04-17 is multimodal
        contents: [{ role: "user", parts: queryParts }], // Use the constructed parts
        config: {
            systemInstruction: { role: "system", parts: [{ text: systemInstructionString }] },
            temperature: 0.8,
            maxOutputTokens: 2048,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
        }
    });
    
    for await (const chunk of stream) {
      if (chunk?.promptFeedback?.blockReason) {
        throw new Error(`Stream blocked by Gemini. Reason: ${chunk.promptFeedback.blockReason}${chunk.promptFeedback.blockReasonMessage ? ' - ' + chunk.promptFeedback.blockReasonMessage : ''}.`);
      }
      const candidate = chunk?.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        const safetyRatings = candidate.safetyRatings;
        let blockedCategories = safetyRatings?.filter(r => r.probability !== 'NEGLIGIBLE' && r.probability !== 'LOW').map(r => r.category.replace('HARM_CATEGORY_', '')).join(', ');
        throw new Error(`Stream ended by Gemini's safety filters. Categories: ${blockedCategories || 'Content policy'}.`);
      }
      if (!chunk.text && (candidate?.finishReason === 'OTHER' || candidate?.finishReason === 'RECITATION')) {
        throw new Error(`Gemini stream ended unexpectedly or provided empty content. Reason: ${candidate?.finishReason}.`);
      }
      yield chunk;
    }

  } catch (error) {
    console.error("Error during Gemini API stream:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
     if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("permission_denied")) {
        throw new Error("The provided Gemini API key is invalid or lacks permissions. Please check it in settings.");
    }
    throw new Error(`Gemini API streaming error: ${errorMessage}`);
  }
}