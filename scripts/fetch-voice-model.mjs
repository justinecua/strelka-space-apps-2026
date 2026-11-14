// Downloads the on-device speech model (Vosk, small US English, about 41 MB) into public/models,
// so the website and the desktop app can recognise speech offline. It runs before dev and build,
// and skips the download when the file is already there. The model is not kept in git.
//
// Why the small model: the larger English model (0.22-lgraph, 128 MB) was tried and recognised better,
// but in the browser it could not keep up with live speech (each command came later than the last).
// Accuracy comes instead from listening only for Strelka's own phrases (see lib/voiceVocabulary.js).
//
// You can also download the file yourself and put it in public/models/ under the same name.

import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const MODEL = 'vosk-model-small-en-us-0.15'
// Already packed the way the browser engine (vosk-browser) needs it, by that library's author.
const MODEL_URLS = [`https://ccoreilly.github.io/vosk-browser/models/${MODEL}.tar.gz`]
const MODEL_SHA256 = 'f0b24bb92a48ca575b6a96500d6b543f0f079c573dfe85bbe16001fc0404e1d8'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, `public/models/${MODEL}.tar.gz`)

async function sha256(file) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(file), hash)
  return hash.digest('hex')
}

if (existsSync(target) && (await sha256(target)) === MODEL_SHA256) {
  console.log('Voice model already downloaded.')
  process.exit(0)
}

mkdirSync(dirname(target), { recursive: true })
const partial = `${target}.part`

for (const url of MODEL_URLS) {
  try {
    console.log(`Downloading the voice model (about 41 MB, only once) from ${new URL(url).host}...`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial))
    if ((await sha256(partial)) !== MODEL_SHA256) throw new Error('the file does not match the expected fingerprint')
    renameSync(partial, target)
    console.log('Voice model ready.')
    process.exit(0)
  } catch (error) {
    rmSync(partial, { force: true })
    console.warn(`  ${new URL(url).host} failed: ${error.message}`)
  }
}

console.error('Could not download the voice model. Voice commands will not work until it is. Run: npm run fetch-model')
// Don't fail the build: the rest of the app works without voice.
