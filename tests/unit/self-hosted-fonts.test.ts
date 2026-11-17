/**
 * Fonts are self-hosted with next/font/local. next/font/google downloads every
 * font from Google at build time, and CI builds were failing whenever that
 * request did: an outage, or a runner Google answered differently, broke the
 * build. These checks keep the build free of that network dependency.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const root = process.cwd()
const srcDir = join(root, 'src')
const fontsDir = join(srcDir, 'fonts')

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [full] : []
  })

describe('self-hosted fonts', () => {
  const files = sourceFiles(srcDir)

  it('never loads fonts from Google at build time', () => {
    const offenders = files
      // The module specifier, so prose that names it (like this file) doesn't count.
      .filter((file) => /['"]next\/font\/google['"]/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(root, file))
    expect(offenders).toEqual([])
  })

  it('points every next/font/local source at a font file that exists', () => {
    const users = files.filter((file) =>
      /['"]next\/font\/local['"]/.test(readFileSync(file, 'utf8'))
    )
    expect(users.length).toBeGreaterThan(0)

    const missing: string[] = []
    let referenced = 0
    for (const file of users) {
      for (const [, path] of readFileSync(file, 'utf8').matchAll(/path:\s*'([^']+\.woff2)'/g)) {
        referenced++
        const target = resolve(dirname(file), path)
        try {
          statSync(target)
        } catch {
          missing.push(`${relative(root, file)} -> ${path}`)
        }
      }
    }
    expect(missing).toEqual([])
    expect(referenced).toBeGreaterThan(0)
  })

  it('ships the Open Font License with every bundled family (OFL requirement)', () => {
    const families = readdirSync(fontsDir).filter((name) =>
      statSync(join(fontsDir, name)).isDirectory()
    )
    expect(families.length).toBeGreaterThan(0)
    const unlicensed = families.filter((family) => {
      try {
        return !readFileSync(join(fontsDir, family, 'OFL.txt'), 'utf8').includes(
          'SIL OPEN FONT LICENSE'
        )
      } catch {
        return true
      }
    })
    expect(unlicensed).toEqual([])
  })
})
