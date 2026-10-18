import { copyFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../dist-single/index.html", import.meta.url));
const to = fileURLToPath(new URL("../../greetings-mockup.html", import.meta.url));
copyFileSync(from, to);
console.log(`✓ greetings-mockup.html (${(statSync(to).size / 1024).toFixed(0)} KB)`);
