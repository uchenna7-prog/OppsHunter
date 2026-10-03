import { generateKeyPairSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const fmt = (k, type) =>
  k.export({ type, format: "pem" }).toString().trim().replace(/\n/g, "\\n");

const privateLine = `JWT_PRIVATE_KEY="${fmt(privateKey, "pkcs8")}"`;
const publicLine = `JWT_PUBLIC_KEY="${fmt(publicKey, "spki")}"`;

const envPath = ".env";
let contents = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

// Remove any old key lines first
contents = contents
  .split("\n")
  .filter((line) => !line.startsWith("JWT_PRIVATE_KEY=") && !line.startsWith("JWT_PUBLIC_KEY="))
  .join("\n")
  .trimEnd();

contents += `\n${privateLine}\n${publicLine}\n`;

writeFileSync(envPath, contents);
console.log("Keys written directly to .env");