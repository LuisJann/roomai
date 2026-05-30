const fs = require('fs');
async function test() {
  const prompt = encodeURIComponent("A modern living room. https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Modern_living_room.jpg/800px-Modern_living_room.jpg");
  const res = await fetch(`https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true&seed=1`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('test-out.jpg', Buffer.from(buffer));
  console.log("Done");
}
test();
