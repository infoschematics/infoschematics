/**
 * Look at Point emphasis in the showcase the way a reader reaches it: open the Benchmark preset in the Playground,
 * enter `SCENE-03` "Edges and substrate" from the Sequences rail, and watch its stage-one cue `DYN-SOURCE` emphasise
 * the Camera Point `PT-01`, at full motion and again under `prefers-reduced-motion: reduce`. Run with:
 *
 *   bun run self:browser:look -- --name tool-142-point-emphasis --path '/playground/?preset=showcase' \
 *     --probe scripts/probes/TOOL-142-point-emphasis.ts
 */
import type { Look } from '../look.ts'

const scene = 'Edges and substrate'
const camera = '.infoschematic-element-emphasis[data-dynamic-id="DYN-SOURCE"][data-artefact-id="PT-01"]'
const directory = 'reports/tool-142-point-emphasis'

/**
 * Enter the Scene and hold it there. The Story is timed, and its authored hold reaches the runtime as milliseconds
 * where the schema documents seconds, so left alone it spins through every Scene many times a second and remounts
 * each emphasis before it can play. Holding auto-advance and stepping back onto the Scene is what lets a finite
 * emphasis be seen at all. The spin is `INFOSCHEMATICS-TOOL-150`, not something the document should work around.
 */
const enterScene = async ({ note, page }: Look, motion: string) => {
  const enter = page.locator(`.rail-pathway[aria-label="${scene}"]`)
  if ((await enter.count()) !== 1) throw new Error(`expected one Sequences rail control for "${scene}"`)
  await enter.click()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  const pressedNow = () => page.locator('.rail-pathway[aria-pressed="true"]').allInnerTexts()
  const held = async () => {
    const before = (await pressedNow()).join()
    await page.waitForTimeout(300)
    return (await pressedNow()).join() === before
  }
  let attempts = 0
  do {
    await page.keyboard.press('Space')
    attempts += 1
  } while (!(await held()) && attempts < 4)
  if (!(await held())) throw new Error(`${motion}: the Story kept advancing after Space`)
  for (let step = 0; step < 8 && (await pressedNow()).join() !== 'SCENE-03'; step += 1) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(30)
  }
  // Stepping lands on the Scene's first stage, which is where `DYN-SOURCE` is cued.
  const pressed = await page.locator('.rail-pathway[aria-pressed="true"]').allInnerTexts()
  note(`${motion}: entered ${scene} and held auto-advance; rail control pressed: ${pressed.join(', ')}`)
  if (pressed.join() !== 'SCENE-03') throw new Error(`${motion}: could not hold ${scene}`)
}

/** Sample every emphasis group for three seconds, noting when each first appears and when it is first gone. */
const watch = async (look: Look, motion: string) => {
  const { note, page, shot } = look
  const seen = new Map<string, number>()
  let closeUps = 0
  for (let at = 0; at <= 3000; at += 100) {
    const groups = await page.locator('.infoschematic-element-emphasis').evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect()
        const drawn = box.width > 0 && box.height > 0 ? 'drawn' : 'empty'
        return `${node.getAttribute('data-dynamic-id')} on ${node.getAttribute('data-artefact-id')} (${node.getAttribute('data-depicts') ?? 'event'}) ${drawn}`
      })
    )
    for (const group of groups) if (!seen.has(group)) seen.set(group, at)
    const box = await page.evaluate((selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      return rect ? { height: rect.height, width: rect.width, x: rect.x, y: rect.y } : null
    }, camera)
    const ring = await page.evaluate((selector) => {
      const circle = document.querySelector(`${selector} > circle`)
      if (!circle) return null
      const style = getComputedStyle(circle)
      const animation = circle.getAnimations()[0]
      const timing = animation?.effect?.getComputedTiming()
      const played = animation
        ? `${animation.playState} at ${Math.round(Number(animation.currentTime))}ms of ${Math.round(Number(timing?.duration))}ms`
        : 'no animation'
      return `r=${circle.getAttribute('r')} opacity=${Number(style.opacity).toFixed(2)} stroke=${style.stroke} width=${style.strokeWidth}; ${played}`
    }, camera)
    if (ring && (at <= 1000 || at % 500 === 0)) note(`${motion}: +${at}ms Camera ring ${ring}`)
    if (box && box.width > 0 && closeUps < 2 && (at === 200 || at === 400)) {
      closeUps += 1
      const pad = 70
      await page.screenshot({
        clip: {
          height: box.height + pad * 2,
          width: box.width + pad * 2,
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad)
        },
        path: `${directory}/${motion}-camera-close-${at}ms.png`,
        scale: 'device'
      })
      note(
        `${motion}: close-up of the Camera at +${at}ms, ring box ${Math.round(box.width)}x${Math.round(box.height)} at ${Math.round(box.x)},${Math.round(box.y)}`
      )
    }
    if (at === 300) await shot(`${motion}-scene-03-at-${at}ms`)
    await page.waitForTimeout(100)
  }
  for (const [group, at] of seen) note(`${motion}: first seen at +${at}ms: ${group}`)
  if (![...seen.keys()].some((group) => group.startsWith('DYN-SOURCE on PT-01') && group.endsWith('drawn')))
    throw new Error(`${motion}: DYN-SOURCE never drew an emphasis on PT-01`)
}

/**
 * The finite fade has finished by the time the Scene is held and sampled, so seek it to the middle of its plateau and
 * capture that frame: the picture a reader sees at the height of the event, painted by the browser's own animation.
 */
const peak = async ({ note, page }: Look) => {
  const state = await page.evaluate((selector) => {
    const circle = document.querySelector(`${selector} > circle`)
    const animation = circle?.getAnimations()[0]
    if (!circle || !animation) return null
    animation.pause()
    animation.currentTime = 400
    return `opacity=${Number(getComputedStyle(circle).opacity).toFixed(2)}`
  }, camera)
  if (!state) throw new Error('no finite Camera emphasis to seek')
  const box = await page.evaluate((selector) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect()
    return rect ? { height: rect.height, width: rect.width, x: rect.x, y: rect.y } : null
  }, camera)
  if (!box) throw new Error('Camera emphasis has no box')
  const pad = 70
  await page.screenshot({
    clip: {
      height: box.height + pad * 2,
      width: box.width + pad * 2,
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad)
    },
    path: `${directory}/full-motion-camera-close-peak.png`
  })
  note(`full-motion: finite emphasis seeked to 400ms of its fade (${state}); close-up written`)
}

export const look = async (context: Look) => {
  const { page, shot, url } = context
  await page.goto(url('/playground/?preset=showcase'), { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await shot('showcase-before')
  await enterScene(context, 'full-motion')
  await watch(context, 'full-motion')
  await peak(context)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await enterScene(context, 'reduced-motion')
  await watch(context, 'reduced-motion')
}
