import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * A preview server for one rendered document, built on the Node standard library.
 *
 * Nothing here reads the filesystem. The server holds the current render in memory and serves exactly three things —
 * a page, that render, and a refresh stream — so no pathname a request names can reach a file. That is the whole
 * security model, and it is a property of the code rather than of a filter that has to be kept correct.
 */

/** The current render, or the diagnostic explaining why the last one still stands. */
export type PreviewState = Readonly<{
  /** Why the most recent attempt failed, if it did. The retained render is still served. */
  diagnostic?: string
  /** The last render that succeeded, absent only before the first one does. */
  rendered?: string | Uint8Array
}>

export type PreviewServer = Readonly<{
  close: () => Promise<void>
  /** The port actually bound, which is the requested one unless the operating system was asked to choose. */
  port: number
  /** Publish a new state and tell every open page to reload. */
  update: (state: PreviewState) => void
}>

export type PreviewServerOptions = Readonly<{
  contentType: string
  host: string
  port: number
  state: PreviewState
}>

const escaped = (contents: string) =>
  contents.replace(/[&<>]/g, (character) => (character === '&' ? '&amp;' : character === '<' ? '&lt;' : '&gt;'))

/**
 * The preview page: the render, plus the current diagnostic when there is one, plus a reload subscription.
 *
 * The page reloads whole rather than swapping the image, because a reload is one line of script with no state to keep
 * consistent, and a preview that occasionally flickers is better than one that can disagree with the document.
 */
const page = (state: PreviewState, revision: number) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Infoschematic preview</title>
    <style>
      :root { color-scheme: dark; }
      body { background: #081725; color: #e8eef5; font: 16px/1.5 system-ui, sans-serif; margin: 0; padding: 1.5rem; }
      img { display: block; max-width: 100%; }
      pre { background: #2a1116; border-left: 4px solid #e2607a; margin: 0 0 1.5rem; padding: 1rem; white-space: pre-wrap; }
      p { color: #93a4b6; }
    </style>
  </head>
  <body>
${state.diagnostic ? `    <pre>${escaped(state.diagnostic)}</pre>\n` : ''}${
  state.rendered === undefined
    ? '    <p>Waiting for a document that renders.</p>\n'
    : `    <img alt="Rendered Infoschematic" src="/render?revision=${revision}" />\n`
}    <script>new EventSource('/events').addEventListener('message', () => location.reload())</script>
  </body>
</html>
`

/** Nothing served here may be cached: the point of the page is that it shows the document as it is now. */
const freshly = (contentType: string) => ({ 'cache-control': 'no-store', 'content-type': contentType })

/** Start serving one document's render, resolving once the socket is bound or rejecting if it cannot be. */
export async function startPreviewServer(options: PreviewServerOptions): Promise<PreviewServer> {
  let state = options.state
  let revision = 0
  const subscribers = new Set<import('node:http').ServerResponse>()

  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://preview.invalid').pathname

    if (pathname === '/') {
      response.writeHead(200, freshly('text/html; charset=utf-8')).end(page(state, revision))
      return
    }

    if (pathname === '/render') {
      if (state.rendered === undefined) {
        response.writeHead(503, freshly('text/plain; charset=utf-8')).end('No document has rendered yet.\n')
        return
      }
      response.writeHead(200, freshly(options.contentType)).end(state.rendered)
      return
    }

    if (pathname === '/events') {
      response.writeHead(200, { ...freshly('text/event-stream'), connection: 'keep-alive' })
      response.write(': connected\n\n')
      subscribers.add(response)
      request.on('close', () => subscribers.delete(response))
      return
    }

    // The preview serves a document, not a directory. Every other pathname is simply not a thing that exists here.
    response
      .writeHead(404, freshly('text/plain; charset=utf-8'))
      .end('The preview serves only the rendered document.\n')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port, options.host, () => {
      server.removeListener('error', reject)
      resolve()
    })
  })

  return {
    close: () =>
      new Promise<void>((resolve) => {
        for (const subscriber of subscribers) subscriber.end()
        subscribers.clear()
        server.close(() => resolve())
      }),
    port: (server.address() as AddressInfo).port,
    update: (next) => {
      state = next
      revision += 1
      for (const subscriber of subscribers) subscriber.write(`data: ${revision}\n\n`)
    }
  }
}
