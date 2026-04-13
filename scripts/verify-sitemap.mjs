/**
 * Post-build verification: ensures dist/sitemap.xml exists and is valid XML.
 */
import { readFileSync, existsSync } from "fs";

const path = "dist/sitemap.xml";

if (!existsSync(path)) {
  console.error("❌ dist/sitemap.xml is missing!");
  process.exit(1);
}

const content = readFileSync(path, "utf-8");

if (!content.trimStart().startsWith("<?xml")) {
  console.error("❌ dist/sitemap.xml does not look like valid XML!");
  console.error("   First 200 chars:", content.slice(0, 200));
  process.exit(1);
}

console.log(`✅ dist/sitemap.xml verified (${content.length} bytes)`);
