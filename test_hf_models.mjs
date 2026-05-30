import { HfInference } from "@huggingface/inference";
import fs from 'fs';

async function testModels() {
  const apiKey = process.env.HF_TOKEN || "";
  if (!apiKey) {
    console.log("No HF_TOKEN set");
    return;
  }

  const hf = new HfInference(apiKey);
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const buffer = Buffer.from(dummyBase64, "base64");
  const imageBlob = new Blob([buffer]);

  const models = [
    "runwayml/stable-diffusion-v1-5",
    "stabilityai/stable-diffusion-xl-refiner-1.0",
    "prompthero/openjourney",
    "SG161222/Realistic_Vision_V1.4",
  ];

  for (const model of models) {
    console.log(`Testing model: ${model}`);
    try {
      const resultBlob = await hf.imageToImage({
        model: model,
        inputs: imageBlob,
        parameters: { prompt: "test", strength: 0.6 }
      });
      console.log(`✅ Success with ${model}. Blob size: ${resultBlob.size}`);
    } catch (e) {
      console.log(`❌ Failed ${model}:`, e.message);
    }
  }
}

testModels();
