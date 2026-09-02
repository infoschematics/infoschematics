import { useEffect, useRef, useState } from 'react'
import type { InterfaceConfig } from '@infoschematics/model/interface'

// The published contract pack as the dashboard reads it: which specifications
// nothing on the Infoschematic reaches, and how one is fetched and summarised.
//
// The list itself is no longer here. Six entries were authored in this file,
// naming a code, a label and an `href` the model already knew - so the panel
// looped over six while the model held twenty-six, and the twenty with no
// published document had nowhere to appear. `href` now sits on the
// specification in `src/play/interfaces.ts`, beside the rest of one.


export type ContractOperation = { name: string; detail: string; summary?: string }

export type ContractDetail = {
  title: string
  version: string
  description?: string
  servers: string[]
  operations: ContractOperation[]
}

export type SpecDocument = {
  openapi?: string
  info?: { title?: string; version?: string; description?: string }
  servers?: Record<string, { url?: string; host?: string; protocol?: string }> | { url?: string }[]
  /**
   * OpenAPI's own field, and not ours to rename.
   *
   * This said `connections`, because a rename that moved this repository's own
   * word away from `path` reached into the shape of a document it does not own.
   * Every contract then read as having no operations at all: the field was
   * never present, `?? {}` swallowed it, and the Specifications tab showed an
   * empty list rather than an error.
   */
  paths?: Record<string, Record<string, { summary?: string }>>
  channels?: Record<string, { address?: string }>
  operations?: Record<string, { action?: string; summary?: string; channel?: { $ref?: string } }>
}

const httpMethods = ['get', 'put', 'post', 'delete', 'patch']

// The published specs are static files, so one reader covers both flavours
// rather than pulling in a schema-aware parser for eight small documents.
export function readSpec(document: SpecDocument): ContractDetail {
  const servers = Array.isArray(document.servers)
    ? document.servers.map((server) => server.url ?? '').filter(Boolean)
    : Object.values(document.servers ?? {}).map(
        (server) => server.url ?? (server.host ? `${server.protocol ?? 'http'}://${server.host}` : '')
      )

  const operations: ContractOperation[] = Object.entries(document.paths ?? {}).flatMap(([path, methods]) =>
    Object.entries(methods)
      .filter(([method]) => httpMethods.includes(method))
      .map(([method, operation]) => ({
        name: path,
        detail: method.toUpperCase(),
        summary: operation.summary
      }))
  )

  return {
    title: document.info?.title ?? 'Untitled contract',
    version: document.info?.version ?? '—',
    description: document.info?.description,
    servers: servers.filter(Boolean),
    operations
  }
}

// Fetches on selection and remembers what it has already read, so switching back
// and forth does not re-request a static file.
export function useContractDetail(selected: InterfaceConfig | null) {
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const cache = useRef(new Map<string, ContractDetail>())

  useEffect(() => {
    const href = selected?.href
    if (!selected || !href) {
      setDetail(null)
      setFailed(false)
      return
    }

    const cached = cache.current.get(selected.id)
    if (cached) {
      setDetail(cached)
      setFailed(false)
      return
    }

    let cancelled = false
    setDetail(null)
    setFailed(false)

    fetch(href)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((document: SpecDocument) => {
        if (cancelled) return
        const read = readSpec(document)
        cache.current.set(selected.id, read)
        setDetail(read)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [selected])

  return { detail, failed }
}
