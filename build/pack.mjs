// This is copied from https://github.com/esheyw/pf2e-macro-helper-library/blob/fd73507c1496d3293cc73e4b1540260da6d7083a/build/pack.mjs
// It needs to be modified before use
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";

const MODULE_ID = process.cwd();

const packs = await fs.readdir("./unpacks");
for (const pack of packs) {
  if (pack === ".gitattributes") continue;
  console.log("Packing " + pack);
  await compilePack(
    `${MODULE_ID}/unpacks/${pack}`,
    `${MODULE_ID}/packs/${pack}`
  );
}