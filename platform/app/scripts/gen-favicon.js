const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const Q = String.fromCharCode(34)
const logoPath = path.join(__dirname, "..", "src", "components", "Logo.tsx")
const logoSrc = fs.readFileSync(logoPath, "utf8")
const marker = "d=" + Q
const start = logoSrc.indexOf(marker) + marker.length
const end = logoSrc.indexOf(Q, start)
const d = logoSrc.substring(start, end)
const color = "#14201B"
const svgOpen = "<svg xmlns=" + Q + "http://www.w3.org/2000/svg" + Q + " viewBox=" + Q + "0 0 111 110" + Q + "><path d=" + Q
const svgClose = Q + " fill=" + Q + color + Q + "/></svg>"
const svg = svgOpen + d + svgClose

const sizes = [16, 32, 48, 64]

async function main() {
  const results = []
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
    results.push({ size: size, buf: buf })
  }

  const count = results.length
  const headerSize = 6 + 16 * count
  let offset = headerSize
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  const entries = []
  const blobs = []
  for (let i = 0; i < results.length; i++) {
    const size = results[i].size
    const buf = results[i].buf
    const entry = Buffer.alloc(16)
    const dim = size === 256 ? 0 : size
    entry.writeUInt8(dim, 0)
    entry.writeUInt8(dim, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(buf.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset = offset + buf.length
    entries.push(entry)
    blobs.push(buf)
  }

  const parts = [header].concat(entries).concat(blobs)
  const icoBuffer = Buffer.concat(parts)
  const outPath = path.join(__dirname, "..", "src", "app", "favicon.ico")
  fs.writeFileSync(outPath, icoBuffer)
  console.log("FAVICON_WRITTEN bytes=" + icoBuffer.length)
}

main().catch(function (e) {
  console.error("FAVICON_GEN_ERROR " + e.message)
  process.exit(1)
})
