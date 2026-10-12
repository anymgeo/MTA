// libvips processes the pyramid with a bounded cache. Never rewrite the source file.
import sharp from 'sharp';
import {writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
sharp.cache({memory:64,files:20,items:50});sharp.concurrency(2);
const [input,mode='build']=process.argv.slice(2);
const image=sharp(input,{limitInputPixels:false,sequentialRead:true,failOn:'error'});
const metadata=await image.metadata();
if(!['jpeg','png','webp'].includes(metadata.format)||!metadata.width||!metadata.height)throw new Error('Choose a valid PNG, JPG or WebP image.');
if(mode==='info'){process.stdout.write(JSON.stringify({width:metadata.width,height:metadata.height,extension:metadata.format==='jpeg'?'.jpg':'.'+metadata.format}));}
else{
  const stem=input.slice(0,input.length-path.extname(input).length),file=path.basename(stem),tileSize=512;
  await sharp(input,{limitInputPixels:false,sequentialRead:true}).resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(stem+'-preview.webp');
  await image.jpeg({quality:92}).tile({size:tileSize,overlap:0,layout:'dz',depth:'onepixel'}).toFile(stem+'.dzi');
  const manifest={width:metadata.width,height:metadata.height,tileSize,maxLevel:Math.ceil(Math.log2(Math.max(metadata.width,metadata.height))),baseUrl:`/media/${file}_files`,previewUrl:`/media/${file}-preview.webp`};
  await writeFile(stem+'.tiles.json.tmp',JSON.stringify(manifest));await rename(stem+'.tiles.json.tmp',stem+'.tiles.json');
  process.stdout.write(JSON.stringify(manifest));
}
