#!/usr/bin/env node
import { runRendererCli } from './index.ts'

process.exitCode = await runRendererCli(process.argv.slice(2))
