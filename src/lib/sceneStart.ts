// Whether the last in-app page change started with the scroller at the
// top. A direct page load counts as starting at the top.
let startedAtTop = true

export const sceneStartedAtTop = () => startedAtTop

export const recordSceneStart = (atTop: boolean) => {
  startedAtTop = atTop
}
