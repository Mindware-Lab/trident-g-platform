import { mountAppShell } from "../trident-g-iq-shared/runtime/app-shell.js";
import { createScreenRegistry } from "../trident-g-iq-shared/runtime/screen-registry.js";
import { maxNavItems } from "./content/nav.js";
import { hubScreen } from "./screens/hub/screen.js";
import { testsScreen } from "./screens/tests/screen.js";
import { zoneScreen } from "./screens/zone/screen.js";
import { capacityScreen } from "./screens/capacity/screen.js";
import { reasoningScreen } from "./screens/reasoning/screen.js";
import { missionsScreen } from "./screens/missions/screen.js";
import { progressScreen } from "./screens/progress/screen.js";
import { coachReviewScreen } from "./screens/coach-review/screen.js";

const registry = createScreenRegistry([
  hubScreen,
  testsScreen,
  zoneScreen,
  capacityScreen,
  reasoningScreen,
  missionsScreen,
  progressScreen,
  coachReviewScreen
]);

mountAppShell({
  root: document.getElementById("app-root"),
  appKind: "max",
  titlePrefix: "Trident G IQ Max",
  navItems: maxNavItems,
  registry,
  defaultScreenId: "hub"
});
