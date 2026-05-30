import fs from 'fs';

async function testHuggingFace() {
  const token = process.env.HF_TOKEN || "hf_dummy"; // We will mock this or I just want to see if the structure is accepted
  const prompt = "modern interior design, architectural digest";
  
  // Create a dummy base64 image (just a tiny valid png or dummy string)
  // 1x1 transparent PNG
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  const payload = {
    inputs: dummyBase64,
    parameters: {
      prompt: prompt,
      strength: 0.6
    }
  };

  console.log("Sending request to HF API...");
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", res.status);
    if (!res.ok) {
        console.log("Error body:", await res.text());
    } else {
        console.log("Success! Headers:", res.headers.get("content-type"));
    }
  } catch(e) {
    console.error(e);
  }
}

testHuggingFace();
