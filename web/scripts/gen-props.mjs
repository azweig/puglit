import fs from "node:fs"; import path from "node:path"
const key=(fs.readFileSync(".env.local","utf8").match(/OPENAI_API_KEY=(.+)/)||[])[1]?.trim()
let sharp=null; try{sharp=(await import("sharp")).default}catch{}
const STYLE="Pixel art, isometric 2.5D retro office RPG videogame furniture prop (Stardew Valley / Eco style), crisp clean 32-bit pixel art, bold vibrant palette, centered single object, FULLY TRANSPARENT background, no ground, no shadow, no characters, no people, no text."
const PROPS=[
 ["it-desk","an office desk with a desktop computer and a monitor displaying colorful code lines, a keyboard and a coffee mug, viewed at 3/4 isometric angle"],
 ["cubicle","an office cubicle workstation: a desk with a monitor and grey fabric partition walls on two sides, 3/4 isometric"],
 ["boardroom-table","a long rectangular dark wooden boardroom meeting table, empty, 3/4 isometric, no chairs"],
 ["chair","a single modern dark office swivel chair, 3/4 isometric"],
 ["projector-screen","a large white presentation/projector screen on a metal stand next to a small ceiling-style projector, 3/4 isometric"],
 ["easel","an artist easel holding a colorful abstract canvas painting, with a small stool and paint tubes beside it, 3/4 isometric"],
 ["sofa","a cozy two-seat lounge sofa with cushions, warm color, 3/4 isometric"],
 ["coffee-station","an office coffee machine on a small counter with two cups and a jar, 3/4 isometric"],
 ["plant","a tall leafy potted office plant in a terracotta pot, 3/4 isometric"],
]
async function gen(p){const res=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-image-1",prompt:`${STYLE} The object: ${p}.`,size:"1024x1024",n:1,background:"transparent"})});if(!res.ok)throw new Error(res.status+" "+(await res.text()).slice(0,140));const d=await res.json();return Buffer.from(d.data[0].b64_json,"base64")}
for(const [id,p] of PROPS){const out=path.join("public/sprites/props",id+".png");if(fs.existsSync(out)){console.log("skip",id);continue}try{let b=await gen(p);if(sharp)b=await sharp(b).resize(220,220,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9}).toBuffer();fs.writeFileSync(out,b);console.log("✓",id,Math.round(b.length/1024)+"KB")}catch(e){console.log("✗",id,e.message)}}
console.log("props done")
