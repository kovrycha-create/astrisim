
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

export const getStrandDescription = async (strandName: string): Promise<string> => {
    if (!API_KEY) {
        return `Gemini API key is not configured. Please set the API_KEY environment variable. \n\nAbout ${strandName}:\nThis is a mystical entity in the Astrisim universe. Its full potential and story can be revealed with AI.`;
    }

    const prompt = `You are a mystical storyteller for the world of Astrisim. Describe the essence, personality, and powers of the Strand named "${strandName}". Be evocative, poetic, and concise, in about 3-4 sentences.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 0.95,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error generating content for ${strandName}:`, error);
        throw new Error("Failed to get description from Gemini API.");
    }
};

export const getCrystalLore = async (): Promise<string> => {
    if (!API_KEY) {
        return "A whisper from the crystal is lost to the void. (API key not configured).";
    }

    const prompt = `You are a mystical storyteller for the world of Astrisim. Generate a single, cryptic, one-sentence piece of lore revealed by a "Whispering Crystal". The tone should be mysterious and hint at a larger story. Examples: 'Thirteen paths were one, and shall be again.', 'Even the void fears the dreamer's gaze.', 'The first star still watches.'`;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 1.0,
                topP: 1.0,
            }
        });
        return `Crystal Whisper: "${response.text.trim()}"`;
    } catch (error) {
        console.error(`Error generating crystal lore:`, error);
        throw new Error("Failed to get lore from Gemini API.");
    }
};