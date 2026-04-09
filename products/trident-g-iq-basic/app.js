import { mountAppShell } from "../trident-g-iq-shared/runtime/app-shell.js";
import { createScreenRegistry } from "../trident-g-iq-shared/runtime/screen-registry.js";
import { basicNavItems } from "./content/nav.js";
import { hubScreen } from "./screens/hub/screen.js";
import { testsScreen } from "./screens/tests/screen.js";
import { zoneScreen } from "./screens/zone/screen.js";
import { capacityLabScreen } from "./screens/capacity-lab/screen.js";

const registry = createScreenRegistry([
  hubScreen,
  testsScreen,
  zoneScreen,
  capacityLabScreen
]);

mountAppShell({
  root: document.getElementById("app-root"),
  appKind: "basic",
  titlePrefix: "Trident G IQ Basic",
  navItems: basicNavItems,
  registry,
  defaultScreenId: "hub"
});
