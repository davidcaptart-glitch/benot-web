/**
 * copy-assets.js — Prebuild script
 *
 * Copies the root `assets/` folder into `public/assets/` so that
 * Next.js static export can serve all images.
 *
 * On Windows dev the public/assets directory is a junction to ../assets,
 * so we skip the copy if it already points to the right place.
 * On Linux CI (GitHub Actions) the junction doesn't exist, so we copy.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets");
const DEST = path.join(ROOT, "public", "assets");

// Check whether the destination already exists as a real directory
// with content (i.e. the Windows junction is in place)
function isAlreadyLinked() {
  try {
    const stat = fs.lstatSync(DEST);
    if (stat.isSymbolicLink() || stat.isDirectory()) {
      // Verify it actually has content
      const entries = fs.readdirSync(DEST);
      return entries.length > 0;
    }
  } catch {
    // Doesn't exist
  }
  return false;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (isAlreadyLinked()) {
  console.log("✓ public/assets already populated (junction/symlink detected) — skipping copy.");
} else {
  if (!fs.existsSync(SRC)) {
    console.warn("⚠  Source assets/ folder not found at:", SRC);
    console.warn("   Make sure the assets/ folder exists at the project root.");
    process.exit(0); // Don't fail the build — maybe assets folder is empty in this env
  }
  console.log("→ Copying assets/ → public/assets/ …");
  copyDir(SRC, DEST);
  const count = fs.readdirSync(SRC, { recursive: true }).length;
  console.log(`✓ Done. Copied ${count} entries to public/assets/`);
}
