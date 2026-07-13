/**
 * Bundles entry.ts with Metro exactly as a React Native app would, proving the
 * mobile shared surface has no web-, Node-, or Prisma-only code in its module
 * graph. Fails loudly if any module cannot resolve or transform.
 */
const path = require('path');
const fs = require('fs');
const Metro = require('metro');

async function main() {
  const outDir = path.join(__dirname, 'dist');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'mobile-surface.bundle.js');

  const config = await Metro.loadConfig({
    config: path.join(__dirname, 'metro.config.cjs'),
  });

  await Metro.runBuild(config, {
    entry: path.join(__dirname, 'entry.ts'),
    out,
    platform: 'ios',
    dev: true,
    minify: false,
    sourceMap: false,
  });

  const size = fs.statSync(out).size;
  if (size < 1000) {
    throw new Error(`Bundle suspiciously small (${size} bytes) — surface may not have been included.`);
  }
  const bundle = fs.readFileSync(out, 'utf8');
  // Fingerprints of the scenario catalog and Prisma; must never reach mobile.
  const leaks = ['scenario_adobe_2019', 'PrismaClient'].filter((marker) => bundle.includes(marker));
  if (leaks.length > 0) {
    throw new Error(`Forbidden content bundled into the mobile surface: ${leaks.join(', ')}`);
  }
  console.log(`mobile-smoke: Metro bundle OK (${Math.round(size / 1024)} KiB, ios, dev)`);
}

main().catch((error) => {
  console.error('mobile-smoke: Metro bundle FAILED');
  console.error(error);
  process.exit(1);
});
