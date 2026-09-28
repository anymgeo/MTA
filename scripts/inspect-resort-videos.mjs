import { readFile } from 'node:fs/promises';
for (const file of process.argv.slice(2)) {
  const b = await readFile(file), boxes = [];
  for (let pos = 0; pos + 8 <= b.length;) {
    let size = b.readUInt32BE(pos);
    const type = b.toString('ascii', pos + 4, pos + 8);
    if (size === 1) size = Number(b.readBigUInt64BE(pos + 8));
    if (!size) size = b.length - pos;
    if (size < 8 || pos + size > b.length) throw new Error('Invalid MP4 container');
    boxes.push({ type, offset: pos, size }); pos += size;
  }
  const sample = b.indexOf(Buffer.from('avc1')), header = b.indexOf(Buffer.from('mvhd'));
  let duration;
  if (header >= 0 && b[header + 4] === 0) duration = b.readUInt32BE(header + 20) / b.readUInt32BE(header + 16);
  console.log(JSON.stringify({ file, bytes:b.length, h264:sample>=0, durationSeconds:duration,
    fastStart:boxes.find(x=>x.type==='moov')?.offset < boxes.find(x=>x.type==='mdat')?.offset,
    boxes:boxes.map(x=>x.type) }));
}
