/* ─────────────────────────────────────────────────────────────────────
   OPTIMIZE IMAGES
   Makes web copies of every image in public/images/products/ and
   writes them to public/images/products-optimized/. The originals are
   never changed.

   Each image gets WebP copies at the widths below that are smaller
   than the original, so the site can send each screen the size it
   needs. The largest size is the original file itself, copied without
   re-encoding: these photos are already well compressed, and a full-
   size WebP that keeps their detail is barely smaller (sometimes
   larger). Only originals wider than MAX_WIDTH, or in a format
   browsers can't show, are scaled down or converted instead. Nothing
   is ever enlarged.

     npm run images          optimize anything new or changed, then stop
     npm run images:watch    keep running and optimize images as they
                             are added (Ctrl+C to stop)

   It also runs before every `npm run build`, so a deploy never ships
   an image that wasn't optimized.

   manifest.json in the output folder records each original's content
   hash and the copies made from it. Unchanged images are skipped;
   changing a setting below redoes them all; deleting an original
   deletes its copies.
───────────────────────────────────────────────────────────────────── */
import { createHash } from "crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, watch, writeFileSync } from "fs";
import { basename, extname, join, relative } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SRC_DIR = join(ROOT, "public", "images", "products");
const OUT_DIR = join(ROOT, "public", "images", "products-optimized");
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".avif"]);
const BROWSER_FORMATS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/* Gallery cards are up to 544px wide (1088 on high-density screens);
   the enlarged view can fill a large monitor. */
const WIDTHS = [480, 800, 1200, 1600];
const MAX_WIDTH = 2560;

/* Quality 90 with smart subsampling keeps paint texture and saturated
   colour edges (reds especially) that lower settings smear. */
const WEBP = { quality: 90, smartSubsample: true, effort: 6 };

const SETTINGS_KEY = hash(JSON.stringify({ WIDTHS, MAX_WIDTH, WEBP }));

/* "Rose Garden.JPG" → "rose-garden": copies get web-safe names, since a
   space would break the list of sizes the site gives the browser */
function webName(name) {
  return basename(name, extname(name)).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
}

function hash(data) {
  return createHash("sha1").update(data).digest("hex").slice(0, 16);
}

function loadManifest() {
  try {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
    if (manifest.settings === SETTINGS_KEY) return manifest;
  } catch {
    // Missing or unreadable — start fresh
  }
  return { settings: SETTINGS_KEY, images: {} };
}

function removeCopies(entry) {
  for (const { file } of entry?.files ?? []) {
    rmSync(join(OUT_DIR, file), { force: true });
  }
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function optimize(name, source) {
  const { width: originalWidth, height: originalHeight } = await sharp(source).metadata();
  const ext = extname(name).toLowerCase();
  const stem = webName(name);
  const largest = Math.min(originalWidth, MAX_WIDTH);
  const copyOriginal = originalWidth <= MAX_WIDTH && BROWSER_FORMATS.has(ext);

  const webpWidths = WIDTHS.filter((w) => w < largest);
  if (!copyOriginal) webpWidths.push(largest);

  const files = await Promise.all(
    webpWidths.map(async (width) => {
      const file = `${stem}-${width}.webp`;
      const { size } = await sharp(source)
        .autoOrient()         // phone photos store rotation separately
        .keepIccProfile()     // keep the photo's colour profile, if any
        .resize({ width, withoutEnlargement: true })
        .webp(WEBP)
        .toFile(join(OUT_DIR, file));
      return { width, file, size };
    })
  );

  if (copyOriginal) {
    const file = `${stem}-${originalWidth}${ext}`;
    copyFileSync(join(SRC_DIR, name), join(OUT_DIR, file));
    files.push({ width: originalWidth, file, size: statSync(join(OUT_DIR, file)).size });
  }

  console.log(
    `  ✓ ${name}  ${originalWidth}x${originalHeight}, ${kb(source.length)} → ` +
      files.map((f) => `${f.width}px ${kb(f.size)}`).join(", ")
  );
  return { hash: hash(source), width: originalWidth, height: originalHeight, files };
}

async function optimizeAll() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = loadManifest();
  const names = readdirSync(SRC_DIR).filter((n) => IMAGE_EXTENSIONS.has(extname(n).toLowerCase()));
  let changed = 0;
  let failed = 0;

  /* art1.jpeg and Art1.png would both make art1-800.webp */
  const stems = new Map();
  for (const name of names) {
    const stem = webName(name);
    if (stems.has(stem)) {
      console.error(`  ✗ ${stems.get(stem)} and ${name} share a name — rename one`);
      return 1;
    }
    stems.set(stem, name);
  }

  for (const name of names) {
    let source;
    try {
      source = readFileSync(join(SRC_DIR, name));
    } catch {
      continue; // still being copied in — watch mode tries again
    }
    const previous = manifest.images[name];
    const allCopiesExist = previous?.files.every((f) => existsSync(join(OUT_DIR, f.file)));
    if (previous?.hash === hash(source) && allCopiesExist) continue;

    try {
      removeCopies(previous);
      manifest.images[name] = await optimize(name, source);
      changed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  for (const name of Object.keys(manifest.images)) {
    if (!names.includes(name)) {
      removeCopies(manifest.images[name]);
      delete manifest.images[name];
      console.log(`  − ${name} (original deleted, copies removed)`);
      changed++;
    }
  }

  /* Sweep anything the manifest doesn't list, e.g. copies left by
     earlier settings */
  const listed = new Set(Object.values(manifest.images).flatMap((e) => e.files.map((f) => f.file)));
  for (const file of readdirSync(OUT_DIR)) {
    if (file !== "manifest.json" && !listed.has(file)) rmSync(join(OUT_DIR, file));
  }

  if (changed) writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(changed ? `Images: ${changed} updated` : "Images: all up to date");
  return failed;
}

const failed = await optimizeAll();

if (process.argv.includes("--watch")) {
  console.log(`Watching ${relative(ROOT, SRC_DIR)} for new images…`);
  /* Copying a file fires several events; wait until they settle so a
     half-copied image isn't read. */
  let timer;
  let running = Promise.resolve();
  watch(SRC_DIR, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      running = running.then(optimizeAll);
    }, 1000);
  });
} else if (failed) {
  process.exit(1);
}
