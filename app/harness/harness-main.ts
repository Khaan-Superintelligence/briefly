// Briefly harness bootstrap — loads the widget under the mock bridge.
// Kit is the cloned repo at ../../harness (local-path consumption).
import { startHarness } from '../../harness/src/mockbridge'

await startHarness({
  widgetEntry: () => import('/src/main.ts'),
  // Briefly's event-capture text container is id 2 / name 't2'.
  capture: { containerID: 2, containerName: 't2' },
})
