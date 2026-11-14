// After the desktop build, deletes files in dist/assets that nothing uses. The landing page is left out of
// the desktop app, but Vite still copies its pictures (the story photo, team photos); this drops them.
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const ASSETS = join(DIST, 'assets')
const files = readdirSync(ASSETS)
const text = [join(DIST, 'index.html'), ...files.filter((name) => /\.(js|css|html)$/.test(name)).map((name) => join(ASSETS, name))]
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')

const unused = files.filter((name) => !/\.(js|css)$/.test(name) && !text.includes(name))
for (const name of unused) rmSync(join(ASSETS, name))
console.log(unused.length ? `Removed ${unused.length} unused files: ${unused.join(', ')}` : 'No unused files.')
