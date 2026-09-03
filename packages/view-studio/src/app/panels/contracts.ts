import { useEffect, useRef, useState } from 'react'
import type { InterfaceConfig } from '@infoschematics/domain-model/interface'

// The host supplies published specification documents; this module reads and
// summarises their standard fields.

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
  /** OpenAPI's standard operation-path field. */
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
