export function createScreenRegistry(screenList) {
  const screensById = new Map(screenList.map((screen) => [screen.id, screen]));

  return {
    all() {
      return screenList.slice();
    },
    first() {
      return screenList[0];
    },
    get(id) {
      return screensById.get(id);
    },
    has(id) {
      return screensById.has(id);
    }
  };
}
