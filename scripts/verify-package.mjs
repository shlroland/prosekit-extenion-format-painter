import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const temp = await mkdtemp(join(tmpdir(), 'format-painter-package-'))

try {
  execFileSync('pnpm', ['pack', '--pack-destination', temp], {
    cwd: root,
    stdio: 'inherit',
  })

  const tarball = join(temp, (await readdir(temp)).find((file) => file.endsWith('.tgz')))
  await writeFile(
    join(temp, 'package.json'),
    JSON.stringify({ private: true, type: 'module', dependencies: { 'prosekit-extension-format-painter': `file:${tarball}` } }),
  )
  await writeFile(join(temp, 'index.mjs'), "import { createFormatPainter, defaultFormatPainterOptions } from 'prosekit-extension-format-painter'\nif (!createFormatPainter(defaultFormatPainterOptions).extension) throw new Error('package import failed')\nif (!import.meta.resolve('prosekit-extension-format-painter/style.css')) throw new Error('CSS export missing')\n")
  await writeFile(join(temp, 'index.ts'), "import { createFormatPainter, defaultFormatPainterOptions } from 'prosekit-extension-format-painter'\ncreateFormatPainter(defaultFormatPainterOptions)\n")
  execFileSync('pnpm', ['install'], { cwd: temp, stdio: 'inherit' })
  execFileSync('node', ['index.mjs'], { cwd: temp, stdio: 'inherit' })
  execFileSync(
    'node',
    [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'index.ts'],
    { cwd: temp, stdio: 'inherit' },
  )
} finally {
  await rm(temp, { recursive: true, force: true })
}
