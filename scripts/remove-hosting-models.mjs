import { rm } from "node:fs/promises";

const modelsDir = new URL("../dist/models", import.meta.url);

await rm(modelsDir, {
  recursive: true,
  force: true,
});

console.log("Removed dist/models from hosting build.");
