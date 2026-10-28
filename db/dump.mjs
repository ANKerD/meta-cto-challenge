import { execFileSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync } from "node:fs";

if (!existsSync("data.sqlite")) throw new Error("Run npm run setup before dumping the database.");

const dump = execFileSync("sqlite3", ["data.sqlite", ".dump"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const target = new URL("seed.sql", import.meta.url);
const temporary = new URL("seed.sql.tmp", import.meta.url);
writeFileSync(temporary, dump);
renameSync(temporary, target);
