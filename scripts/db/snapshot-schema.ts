#!/usr/bin/env node
/**
 * PostgreSQL schema dump (TypeScript / Node.js)
 *
 * Mirrors the bash script:
 * - Dumps schema via `docker compose exec postgres pg_dump ...`
 * - Strips volatile pg_dump header lines
 * - Writes to migrations/schema.sql (via .tmp then rename)
 * - Prints stats + diffs vs previous dump
 * - Checks git diff status if in a git repo
 */

import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as readline from 'node:readline'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { styleText } from 'node:util'

const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n)

function humanFileSize(bytes: number): string {
  if (bytes <= 0) {
    return '0B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  const decimals = i === 0 ? 0 : v < 10 ? 2 : v < 100 ? 1 : 0
  return `${v.toFixed(decimals)}${units[i]}`
}

async function fileSizeHuman(filePath: string): Promise<string> {
  try {
    const st = await fs.stat(filePath)
    return humanFileSize(st.size)
  } catch {
    return '0B'
  }
}

function getDbNameFromUrl(databaseUrl: string): string {
  // Similar intent to: sed -E 's/.*\/([^?]+).*/\1/'
  // Prefer URL parsing but gracefully handle odd strings.
  try {
    const u = new URL(databaseUrl)
    const p = u.pathname.replace(/^\//, '')
    return p || 'unknown'
  } catch {
    const m = databaseUrl.match(/\/([^/?#]+)(?:\?|$)/)
    return m?.[1] ?? 'unknown'
  }
}

type SchemaStats = {
  lines: number
  tables: number
  functions: number
  indexes: number
  sizeHuman: string
}

async function computeStats(filePath: string): Promise<SchemaStats> {
  let lines = 0
  let tables = 0
  let functions = 0
  let indexes = 0

  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Number.POSITIVE_INFINITY,
  })

  for await (const line of rl) {
    lines++
    if (line.startsWith('CREATE TABLE')) {
      tables++
    }
    if (line.startsWith('CREATE FUNCTION')) {
      functions++
    }
    if (/^CREATE.*INDEX/.test(line)) {
      indexes++
    }
  }

  const sizeHuman = await fileSizeHuman(filePath)
  return { lines, tables, functions, indexes, sizeHuman }
}

class StripPgDumpHeadersTransform extends Transform {
  private carry = ''
  override _transform(
    chunk: Buffer,
    _enc: BufferEncoding,
    cb: (err?: Error | null) => void,
  ) {
    try {
      const text = this.carry + chunk.toString('utf8')
      const parts = text.split(/\r?\n/)
      this.carry = parts.pop() ?? ''

      for (const line of parts) {
        if (/^-- Dumped by pg_dump/.test(line)) {
          continue
        }
        if (/^-- Dumped from database version/.test(line)) {
          continue
        }
        this.push(`${line}\n`)
      }
      cb()
    } catch (e) {
      cb(e as Error)
    }
  }
  override _flush(cb: (err?: Error | null) => void) {
    try {
      if (this.carry.length) {
        const line = this.carry
        if (
          !/^-- Dumped by pg_dump/.test(line) &&
          !/^-- Dumped from database version/.test(line)
        ) {
          this.push(`${line}\n`)
        }
      }
      cb()
    } catch (e) {
      cb(e as Error)
    }
  }
}

function runCommand(
  cmd: string,
  args: string[],
  opts?: { cwd?: string },
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: opts?.cwd,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (d) => {
      stdout += d
    })
    child.stderr.on('data', (d) => {
      stderr += d
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
  })
}

async function isGitRepo(): Promise<boolean> {
  const r = await runCommand('git', ['rev-parse', '--git-dir'])
  return r.code === 0
}

async function gitDiffQuiet(filePath: string): Promise<boolean> {
  const r = await runCommand('git', ['diff', '--quiet', filePath])
  return r.code === 0
}

async function gitNumstat(
  filePath: string,
): Promise<{ added: number; removed: number } | null> {
  const r = await runCommand('git', ['diff', '--numstat', '--', filePath])
  if (r.code !== 0) {
    return null
  }
  const line = r.stdout.trim()
  if (!line) {
    return { added: 0, removed: 0 }
  }
  // format: "<added>\t<removed>\t<path>"
  const parts = line.split(/\s+/)
  const added = Number(parts[0])
  const removed = Number(parts[1])
  return {
    added: Number.isFinite(added) ? added : 0,
    removed: Number.isFinite(removed) ? removed : 0,
  }
}

function showDiff(diff: number, label: string): string {
  if (diff > 0) {
    return `├─ ${label}: ${styleText('green', `+${formatNumber(diff)}`)}`
  }
  if (diff < 0) {
    return `├─ ${label}: ${styleText('red', `-${formatNumber(diff)}`)}`
  }
  return `├─ ${label}: ${styleText('blue', 'no change')}`
}

async function main() {
  console.log(`${styleText('bold', '📦 PostgreSQL Schema Dump')}`)
  console.log(
    `${styleText('blue', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}\n`,
  )

  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error(
      styleText(
        'red',
        '❌ Error: DATABASE_URL environment variable is not set',
      ),
    )
    process.exit(1)
  }

  const OUTPUT_FILE = 'migrations/schema.sql'
  const TEMP_FILE = `${OUTPUT_FILE}.tmp`

  const dbName = getDbNameFromUrl(DATABASE_URL)
  console.log(`${styleText('bold', 'Database:')} ${styleText('green', dbName)}`)

  // Ensure output directory exists
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })

  // Previous stats (if file exists)
  let hasOld = false
  let oldStats: SchemaStats | null = null
  try {
    await fs.access(OUTPUT_FILE)
    hasOld = true
    oldStats = await computeStats(OUTPUT_FILE)
  } catch {
    hasOld = false
  }

  console.log(styleText('bold', `Output:   ${OUTPUT_FILE}\n`))

  const start = Date.now()
  console.log(`${styleText('yellow', '⏳ Dumping schema...')}`)

  // Build docker compose pg_dump command
  // Note: "-T" disables TTY allocation which is friendlier for piping.
  const dockerArgs = [
    'compose',
    'exec',
    '-T',
    'postgres',
    'pg_dump',
    DATABASE_URL,
    '--exclude-schema=graphile_migrate',
    '--exclude-schema=pgboss',
    '--schema-only',
    '--no-owner',
    '--format=p',
    '--encoding=UTF-8',
    '--restrict-key=xxx',
  ]

  const child = spawn('docker', dockerArgs, {
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  const outStream = createWriteStream(TEMP_FILE, { encoding: 'utf8' })
  try {
    await pipeline(child.stdout, new StripPgDumpHeadersTransform(), outStream)
  } catch (e) {
    try {
      child.kill()
    } catch {}
    throw e
  }

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => resolve(code ?? 1))
  })

  if (exitCode !== 0) {
    await fs.rm(TEMP_FILE, { force: true }).catch(() => {})
    console.error(
      styleText('red', `❌ Error: pg_dump failed (exit code ${exitCode})`),
    )
    process.exit(exitCode)
  }

  // Verify temp file is non-empty
  let tempOk = false
  try {
    const st = await fs.stat(TEMP_FILE)
    tempOk = st.size > 0
  } catch {
    tempOk = false
  }

  if (!tempOk) {
    await fs.rm(TEMP_FILE, { force: true }).catch(() => {})
    console.error(
      styleText('red', '❌ Error: Schema dump failed or produced empty file'),
    )
    process.exit(1)
  }

  // Move temp to final (atomic on same filesystem)
  await fs.rename(TEMP_FILE, OUTPUT_FILE)

  const elapsedSec = Math.round((Date.now() - start) / 1000)
  const newStats = await computeStats(OUTPUT_FILE)

  console.log(
    `${styleText('green', `✅ Schema dump completed in ${elapsedSec}s`)}\n`,
  )

  console.log(styleText('bold', '📊 Schema Statistics:'))
  console.log(`├─ Tables:     ${formatNumber(newStats.tables)}`)
  console.log(`├─ Functions:  ${formatNumber(newStats.functions)}`)
  console.log(`├─ Indexes:    ${formatNumber(newStats.indexes)}`)
  console.log(`├─ Total lines: ${formatNumber(newStats.lines)}`)
  console.log(`└─ File size:  ${newStats.sizeHuman}`)

  if (hasOld && oldStats) {
    console.log(styleText('bold', '\n📈 Changes from previous dump:'))

    const linesDiff = newStats.lines - oldStats.lines
    const tablesDiff = newStats.tables - oldStats.tables
    const functionsDiff = newStats.functions - oldStats.functions
    const indexesDiff = newStats.indexes - oldStats.indexes

    console.log(showDiff(tablesDiff, 'Tables    '))
    console.log(showDiff(functionsDiff, 'Functions '))
    console.log(showDiff(indexesDiff, 'Indexes   '))
    console.log(showDiff(linesDiff, 'Lines     '))
    console.log(`└─ Size:       ${oldStats.sizeHuman} → ${newStats.sizeHuman}`)

    if (await isGitRepo()) {
      const quiet = await gitDiffQuiet(OUTPUT_FILE)
      if (quiet) {
        console.log(styleText('blue', '\nℹ️  No changes detected in schema'))
      } else {
        console.log(styleText('yellow', '\n⚠️  Schema has uncommitted changes'))
        const ns = await gitNumstat(OUTPUT_FILE)
        if (ns && (ns.added > 0 || ns.removed > 0)) {
          console.log(
            `   ${styleText('green', `+${ns.added}`)} additions, ${styleText('red', `-${ns.removed}`)} deletions`,
          )
        }
      }
    }
  }

  console.log(styleText('blue', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
}

process.on('unhandledRejection', (e) => {
  console.error(styleText('red', '❌ Unhandled rejection:'), e)
  process.exit(1)
})

main().catch((e) => {
  console.error(
    styleText('red', '❌ Error:'),
    e instanceof Error ? e.message : e,
  )
  process.exit(1)
})
