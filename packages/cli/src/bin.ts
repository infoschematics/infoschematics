#!/usr/bin/env node
import { hostRendererCliIo, runRendererCli } from './index.ts'

// An interrupt ends a watch session as a normal outcome rather than killing a render mid-write, so the signal is
// trapped here, in the executable, and left out of the library surface.
const interrupted = new AbortController()
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => interrupted.abort())

process.exitCode = await runRendererCli(process.argv.slice(2), hostRendererCliIo(interrupted.signal))
