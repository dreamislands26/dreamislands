import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const dir = "/opt/dit-platform/scripts/mile-photos"
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg"))

for (const f of files) {
  const full = path.join(dir, f)
  const buf = fs.readFileSync(full)
  const out = await sharp(buf)
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
  fs.writeFileSync(full, out)
  console.log(f, buf.length, "->", out.length)
}

