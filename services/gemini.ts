
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ChildProfile } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

async function concatenateAudioBuffers(buffers: AudioBuffer[], context: AudioContext): Promise<AudioBuffer> {
  if (buffers.length === 0) throw new Error("No buffers to concatenate");
  if (buffers.length === 1) return buffers[0];

  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const combinedBuffer = context.createBuffer(
    buffers[0].numberOfChannels,
    totalLength,
    buffers[0].sampleRate
  );

  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      combinedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
    }
    offset += buffer.length;
  }
  return combinedBuffer;
}

/**
 * Sophisticated tiered chunking logic.
 * Prioritizes splitting at:
 * 1. Paragraph breaks (\n\n)
 * 2. Sentence ends (. ! ?)
 * 3. Secondary punctuation (, ; :)
 * 4. Word boundaries (spaces)
 */
function splitIntoChunks(text: string, maxLen: number = 3000): string[] {
  const chunks: string[] = [];
  let remainingText = text.trim();

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLen) {
      chunks.push(remainingText);
      break;
    }

    let splitIdx = -1;
    const subText = remainingText.substring(0, maxLen);

    // 1. Try Paragraph Split (look in the last 40% of the chunk)
    const paraIdx = subText.lastIndexOf('\n\n');
    if (paraIdx > maxLen * 0.6) {
      splitIdx = paraIdx + 2;
    }

    // 2. Try Sentence Split (look in the last 30% of the chunk)
    if (splitIdx === -1) {
      const sentenceEndRegex = /[.!?]\s/g;
      let match;
      let lastSentenceIdx = -1;
      while ((match = sentenceEndRegex.exec(subText)) !== null) {
        lastSentenceIdx = match.index + 1;
      }
      if (lastSentenceIdx > maxLen * 0.7) {
        splitIdx = lastSentenceIdx;
      }
    }

    // 3. Try Punctuation Split (look in the last 20% of the chunk)
    if (splitIdx === -1) {
      const puncIdx = Math.max(
        subText.lastIndexOf(', '),
        subText.lastIndexOf('; '),
        subText.lastIndexOf(': ')
      );
      if (puncIdx > maxLen * 0.8) {
        splitIdx = puncIdx + 1;
      }
    }

    // 4. Fallback to Word Split
    if (splitIdx === -1) {
      const spaceIdx = subText.lastIndexOf(' ');
      splitIdx = spaceIdx > 0 ? spaceIdx : maxLen;
    }

    chunks.push(remainingText.substring(0, splitIdx).trim());
    remainingText = remainingText.substring(splitIdx).trim();
  }

  return chunks;
}

async function callWithRetry(fn: () => Promise<any>, maxRetries = 2, initialDelay = 800): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const geminiService = {
  createStoryChat(profile: ChildProfile) {
    const ai = getAI();
    const dynamicInstruction = `${SYSTEM_INSTRUCTION}\n\nIMPORTANT: Story must be in ${profile.language}. Appropriate for age ${profile.age}.`;
    
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: dynamicInstruction,
        temperature: 0.8,
      }
    });
  },

  async generateTTS(text: string, voice: string = 'Kore', pitch: number = 1.0): Promise<AudioBuffer | null> {
    const ai = getAI();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      const chunks = splitIntoChunks(text, 3000); 
      const audioBuffers: AudioBuffer[] = [];

      let pitchInstruction = "natural";
      if (pitch < 0.8) pitchInstruction = "very deep, warm, and low";
      else if (pitch < 0.95) pitchInstruction = "slightly deeper and resonant";
      else if (pitch > 1.2) pitchInstruction = "higher-pitched, light, and airy";

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;
        
        // Slight delay to respect rate limits between sequential calls
        if (audioBuffers.length > 0) await sleep(400);

        // Narrative context: tell the model which part it is reading to help with tone
        const narrativeContext = chunks.length > 1 
          ? `(Reading part ${i + 1} of ${chunks.length} of a long story. Maintain a continuous, sleepy, and consistent tone.)` 
          : "";

        const response = await callWithRetry(() => ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `${narrativeContext} Read this bedtime story segment softly and slowly in a ${pitchInstruction} voice: ${chunk}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        }));

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const decodedBytes = decodeBase64(base64Audio);
          const buffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
          audioBuffers.push(buffer);
        }
      }

      if (audioBuffers.length === 0) return null;
      return await concatenateAudioBuffers(audioBuffers, audioContext);

    } catch (error) {
      console.warn("Gemini TTS Quota exceeded or failed. Fallback triggered.", error);
      return null;
    }
  }
};
