import { RequestHandler } from "express";
import { GoogleGenAI, Modality } from "@google/genai";
import { controllerHandler } from "../utils/controllerHandler";
import config from '../config/db/index';


const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY as string });

function decode(base64: string): Uint8Array {
  const binary = Buffer.from(base64, "base64");
  return new Uint8Array(binary);
}

function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  function writeString(str: string) {
    buffer.write(str, offset);
    offset += str.length;
  }

  function writeUInt32LE(value: number) {
    buffer.writeUInt32LE(value, offset);
    offset += 4;
  }

  function writeUInt16LE(value: number) {
    buffer.writeUInt16LE(value, offset);
    offset += 2;
  }

  // RIFF Header
  writeString("RIFF");
  writeUInt32LE(fileSize);
  writeString("WAVE");

  // fmt chunk
  writeString("fmt ");
  writeUInt32LE(16);
  writeUInt16LE(1); // PCM
  writeUInt16LE(numChannels);
  writeUInt32LE(sampleRate);
  writeUInt32LE(byteRate);
  writeUInt16LE(blockAlign);
  writeUInt16LE(bitsPerSample);

  // data chunk
  writeString("data");
  writeUInt32LE(dataSize);
  Buffer.from(pcmData).copy(buffer, 44);

  return buffer;
}

export const generateVoice = controllerHandler(
  async (req) => {
    console.log("in backend")
    const { text, voice, speed, pitch } = req.body;

    if (!text) {
      throw new Error("Text is required");
    }

    const SAMPLE_RATE = 24000;

    const promptModifiers = [speed?.value, pitch?.value].filter(Boolean).join(", ");
    const finalPrompt = `${voice?.promptPrefix || ""}${promptModifiers ? `Say ${promptModifiers}: ` : ""}"${text}"`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice?.apiVoice || "en-US-Standard-A",
            },
          },
        },
      },
    });

    const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini API");
    }

    const pcmData = decode(base64Audio);
    const wavBuffer = pcmToWav(pcmData, SAMPLE_RATE, 1, 16);

    return {
      headers: {
        "Content-Type": "audio/wav",
      },
      data: wavBuffer,
    };
  },
  {
    statusCode: 200,
    message: "Voice generated successfully",
  }
);
