const FACE_MANIFEST_URL = "./face-word-stim/faces.manifest.json";
const WORD_PACKS_URL = "./face-word-stim/words.packs.json";

let cachedAssetsPromise = null;
const imageCache = new Map();

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function flattenWordPack(rawPack) {
  const pack = asObject(rawPack);
  const values = [];
  for (const words of Object.values(pack)) {
    if (!Array.isArray(words)) {
      continue;
    }
    for (let i = 0; i < words.length; i += 1) {
      const word = typeof words[i] === "string" ? words[i].trim().toUpperCase() : "";
      if (word) {
        values.push(word);
      }
    }
  }
  return values;
}

function normalizeFaceManifest(rawManifest) {
  const manifest = asObject(rawManifest);
  const rawFaces = Array.isArray(manifest.faces) ? manifest.faces : [];
  const faces = rawFaces
    .map((entry) => {
      const face = asObject(entry);
      const id = typeof face.id === "string" ? face.id.trim() : "";
      const src = typeof face.src === "string" ? face.src.trim() : "";
      const emotion = typeof face.emotion === "string" ? face.emotion.trim().toLowerCase() : "neutral";
      const pack = face.pack === "B" ? "B" : "A";
      if (!id || !src) {
        return null;
      }
      return {
        id,
        src,
        emotion,
        pack
      };
    })
    .filter(Boolean);
  return faces;
}

function normalizeWordPacks(rawWordPacks) {
  const root = asObject(rawWordPacks);
  const packs = asObject(root.packs);
  const wordsA = flattenWordPack(packs.A);
  const wordsB = flattenWordPack(packs.B);
  return {
    A: wordsA.length ? wordsA : ["DESK", "CLOCK", "ITEM", "FACT"],
    B: wordsB.length ? wordsB : ["BOOK", "PAGE", "LAMP", "DOOR"]
  };
}

function indexFacesByPack(faces) {
  const byPack = {
    A: [],
    B: []
  };
  for (let i = 0; i < faces.length; i += 1) {
    const face = faces[i];
    if (face.pack === "B") {
      byPack.B.push(face);
    } else {
      byPack.A.push(face);
    }
  }
  if (!byPack.A.length && faces.length) {
    byPack.A = faces.slice();
  }
  if (!byPack.B.length && faces.length) {
    byPack.B = faces.slice();
  }
  return byPack;
}

function selectFallbackFace(faces) {
  if (!faces.length) {
    return null;
  }
  const neutral = faces.find((entry) => entry.emotion === "neutral");
  return neutral || faces[0];
}

export async function loadEmotionAssets() {
  if (cachedAssetsPromise) {
    return cachedAssetsPromise;
  }
  cachedAssetsPromise = Promise.all([
    fetch(FACE_MANIFEST_URL).then((res) => res.json()),
    fetch(WORD_PACKS_URL).then((res) => res.json())
  ]).then(([faceManifest, wordPackManifest]) => {
    const faces = normalizeFaceManifest(faceManifest);
    if (!faces.length) {
      throw new Error("Emotion face manifest is empty.");
    }
    const wordsByPack = normalizeWordPacks(wordPackManifest);
    const facesByPack = indexFacesByPack(faces);
    const fallbackFace = selectFallbackFace(faces);
    return {
      faces,
      facesByPack,
      wordsByPack,
      fallbackFace
    };
  });
  return cachedAssetsPromise;
}

function preloadSingleImage(src, priority = "auto") {
  if (!src || typeof src !== "string") {
    return Promise.resolve(false);
  }
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    if (priority === "high") {
      img.fetchPriority = "high";
    }
    img.onload = () => {
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = src;
    if (typeof img.decode === "function") {
      img.decode().then(() => resolve(true)).catch(() => {});
    }
  });
  imageCache.set(src, promise);
  return promise;
}

export async function preloadEmotionImages(srcList, priority = "auto") {
  const safeList = Array.isArray(srcList)
    ? srcList.filter((entry) => typeof entry === "string" && entry.trim())
    : [];
  const unique = Array.from(new Set(safeList));
  const results = await Promise.all(unique.map(async (src) => ({
    src,
    ok: await preloadSingleImage(src, priority)
  })));
  return {
    readySources: results.filter((entry) => entry.ok).map((entry) => entry.src),
    failedSources: results.filter((entry) => !entry.ok).map((entry) => entry.src)
  };
}

