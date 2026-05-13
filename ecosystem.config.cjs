// PM2 config for ConoHa production
// Always reads server.js / .env.* via the `current` symlink so that
// `pm2 startOrReload ecosystem.config.cjs` picks up the latest release.
//
// Placeholders to replace per project:
//   app = app | cpc | crhr
//   ig-builder-light = repo / folder name
//   3006     = from port registry

const fs = require("fs");

const SERVER_DIR = "/var/www/app/ig-builder-light/current";

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}

const envBase = loadEnvFile(SERVER_DIR + "/.env.base");
const envApp = loadEnvFile(SERVER_DIR + "/.env.app");

module.exports = {
  apps: [
    {
      name: "app-ig-builder-light",
      script: SERVER_DIR + "/server.js",
      cwd: SERVER_DIR,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        ...envBase,
        ...envApp,
        NODE_ENV: "production",
        PORT: "3006",
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
