import { GoogleGenAI } from "@google/genai";
import { ImagePart } from '../types';

interface GeminiStreamResponse {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

let geminiClient: GoogleGenAI | null = null;

// Function to initialize the Gemini client
export const initializeGeminiClient = (apiKey: string): boolean => {
  if (!apiKey || !apiKey.startsWith('AIza')) {
    if (geminiClient) {
      geminiClient = null;
    }
    return false;
  }
  try {
    // CORRECT INITIALIZATION for the JS SDK
    geminiClient = new GoogleGenAI({ apiKey }); 
    return true;
  } catch (error) {
    console.error("Failed to initialize GoogleGenerativeAI:", error);
    geminiClient = null;
    return false;
  }
};

export const isGeminiClientInitialized = (): boolean => !!geminiClient;

// Helper to convert ImagePart to the SDK's Part format


// This function correctly uses getGenerativeModel

// Your other functions (generateGeminiClientResponse, etc.) remain largely the same.
// ...

export const generateGeminiClientResponseStream = async (
  prompt: string,
  systemInstruction: string,
  imageParts?: ImagePart[]
): Promise<AsyncIterable<GeminiStreamResponse>> => {
  if (!isGeminiClientInitialized()) {
    throw new Error('Gemini client is not initialized');
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const model = client.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings: [{
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const contents = [
      {
        role: 'system',
        parts: [{ text: systemInstruction }],
      },
      {
        role: 'user',
        parts: [
          { text: prompt },
          ...(imageParts?.map(part => ({
            inlineData: {
              mimeType: 'image/jpeg',
              data: part.inlineData.data
            }
          })) || [])
        ]
      }
    ];

    const stream = await model.generateContentStream(contents);
    return stream;
  } catch (error) {
    console.error('Error generating Gemini response stream:', error);
    throw error;
  }
};