import {spawnSync} from 'node:child_process';
import {mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {decodePng, encodePng} from './lib/png.mjs';

/**
 * Screenshot safe-zone gate. Renders control frames for each reel, then checks
 * every Instagram unsafe zone for opaque/high-contrast content (edge energy).
 * Fails (non-zero exit) with an annotated PNG when content invades a red zone.
 *
 * Usage:
 *   node scripts/qa-reels.mjs                 # all reels
 *   node scripts/qa-reels.mjs GhostPepeReel   # one reel
 *   node scripts/qa-reels.mjs --skip-render    # reuse existing out/qa PNGs
 */

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(root, 'src/reel-system/layout/safe-area.config.json'), 'utf8'));
const {unsafe: ZONES, qa: QA, canvas: CANVAS} = config;
const remotionCli = path.join(root, 'node_modules/@remotion/cli/remotion-cli.js');
const outDir = path.join(root, 'out/qa');

// composition id -> timeline json (for duration) | null (fallback frames)
const REELS = [
  ['GhostPepeReel', 'timeline.json'],
  ['GhostPepeGraveyardReel', 'timeline-graveyard.json'],
  ['GhostPepeDeadlineReel', 'timeline-deadline.json'],
  ['GhostPepeFakeConnectionReel', 'timeline-fake-connection.json'],
  ['GhostPepeQuestReel', 'timeline-quest.json'],
  ['GhostPepeWhitelistReel', 'timeline-whitelist.json'],
  ['GhostPepeLastPercentReel', 'timeline-last-percent.json'],
  ['GhostPepeTimeDrainReel', 'timeline-time-drain.json'],
  ['GhostPepeForeignSimNewsReel', 'timeline-foreign-sim.json'],
  ['GhostPepeTrafficJamReel', 'timeline-traffic-jam.json'],
  ['GhostPepeDualInternetReel', 'timeline-dual-internet.json'],
  ['GhostPepeTrafficSignatureReel', 'timeline-traffic-signature.json'],
  ['GhostPepeTwoNetworksReel', 'timeline-two-networks.json'],
  ['GhostPepeVpnProxyDnsReel', 'timeline-vpn-proxy-dns.json'],
  ['GhostPepeFreeVpnReel', 'timeline-free-vpn.json'],
  ['GhostPepeWhitelistCageReel', 'timeline-whitelist-cage.json'],
  ['GhostPepeDpiFingerprintReel', 'timeline-dpi-fingerprint.json'],
  ['GhostPepeInternetPassportReel', 'timeline-internet-passport.json'],
  ['GhostPepeSuperappReel', 'timeline-superapp.json'],
  ['GhostPepeChatControlReel', 'timeline-chatcontrol.json'],
  ['GhostPepeSimCooldownReel', 'timeline-sim-cooldown.json'],
  // batch 2026-07-25-a1
  ['GhostPepeBatch01WifiMigration', 'timeline-batch01-wifi-migration.json'],
  ['GhostPepeBatch02WhitelistPov', 'timeline-batch02-whitelist-pov.json'],
  ['GhostPepeBatch03SniEnvelope', 'timeline-batch03-sni-envelope.json'],
  ['GhostPepeBatch04PacketTooBig', 'timeline-batch04-packet-too-big.json'],
  ['GhostPepeBatch05OutageRitual', 'timeline-batch05-outage-ritual.json'],
  ['GhostPepeBatch06ReroutedMap', 'timeline-batch06-rerouted-map.json'],
  // batch 2026-07-25-b1
  ['GhostPepeCraftPaintSecret', 'timeline-craft01-paint-secret.json'],
  ['GhostPepeCraftXorSwitch', 'timeline-craft02-xor-switch.json'],
  ['GhostPepeCraftBoxInBox', 'timeline-craft03-box-in-box.json'],
  ['GhostPepeCraftAvalanche', 'timeline-craft04-avalanche.json'],
  ['GhostPepeCraftConciergeLedger', 'timeline-craft05-concierge-ledger.json'],
  ['GhostPepeCraftTwoTimers', 'timeline-craft06-two-timers.json'],
  // coding batch (handshake, tunnel, packets, ports, keys, ping)
  ['GhostPepeHandshakeReel', 'timeline-handshake.json'],
  ['GhostPepeTunnelReel', 'timeline-tunnel.json'],
  ['GhostPepePacketsReel', 'timeline-packets.json'],
  ['GhostPepePortsReel', 'timeline-ports.json'],
  ['GhostPepeKeysReel', 'timeline-keys.json'],
  ['GhostPepePingReel', 'timeline-ping.json'],
  ['GhostPepeWifiNotInternetReel', 'timeline-wifi-not-internet.json'],
  // web/privacy batch
  ['GhostPepeCacheReel', 'timeline-cache.json'],
  ['GhostPepeCookieReel', 'timeline-cookie.json'],
  ['GhostPepePasswordReel', 'timeline-password.json'],
  ['GhostPepeIncognitoReel', 'timeline-incognito.json'],
  ['GhostPepeIpAddressReel', 'timeline-ip-address.json'],
  ['GhostPepeHttpsLockReel', 'timeline-https-lock.json'],
];

const args = process.argv.slice(2);
const skipRender = args.includes('--skip-render');
if (args.includes('--overlay')) process.env.REEL_OVERLAY = '1';
const only = args.filter((a) => !a.startsWith('--'));

// Sample several frames across the timeline so captions/text that only appear
// briefly still get checked (the pixel gate can only see the frames it renders).
const FRACTIONS = [0.12, 0.32, 0.52, 0.72, 0.9];
const framesFor = (timelineFile) => {
  if (timelineFile) {
    const p = path.join(root, 'src/generated', timelineFile);
    if (existsSync(p)) {
      const dur = JSON.parse(readFileSync(p, 'utf8')).durationInFrames;
      if (dur) return FRACTIONS.map((f) => Math.min(dur - 1, Math.max(1, Math.round(dur * f))));
    }
  }
  return [40, 110, 180, 250, 320];
};

const luma = (data, i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

// Edge-energy inside a zone: fraction of pixels with a sharp luminance step to a
// neighbour. Smooth glow/gradients score ~0; text, icons, cards score high.
const zoneEnergy = (img, zone) => {
  const {width, data} = img;
  const x0 = Math.max(0, zone.x);
  const y0 = Math.max(0, zone.y);
  const x1 = Math.min(width - 1, zone.x + zone.width - 1);
  const y1 = Math.min(img.height - 1, zone.y + zone.height - 1);
  let edges = 0;
  let total = 0;
  const worst = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const l = luma(data, i);
      const grad = Math.max(
        Math.abs(l - luma(data, i + 4)),
        Math.abs(l - luma(data, i + width * 4)),
      );
      total++;
      if (grad > QA.edgeThreshold) {
        edges++;
        worst.push([x, y]);
      }
    }
  }
  return {fraction: total ? edges / total : 0, edges, total, worst};
};

const paintZone = (img, zone, violated) => {
  const {width, data} = img;
  const [r, g, b] = violated ? [255, 60, 60] : [255, 200, 60];
  const x1 = Math.min(width - 1, zone.x + zone.width - 1);
  const y1 = Math.min(img.height - 1, zone.y + zone.height - 1);
  for (let y = Math.max(0, zone.y); y <= y1; y++) {
    for (let x = Math.max(0, zone.x); x <= x1; x++) {
      const edge = x === zone.x || y === zone.y || x === x1 || y === y1;
      const i = (y * width + x) * 4;
      const a = edge ? 1 : 0.22;
      data[i] = data[i] * (1 - a) + r * a;
      data[i + 1] = data[i + 1] * (1 - a) + g * a;
      data[i + 2] = data[i + 2] * (1 - a) + b * a;
    }
  }
};

mkdirSync(outDir, {recursive: true});
// Clear stale violation annotations so a passing run leaves no misleading files.
if (existsSync(outDir)) {
  for (const f of readdirSync(outDir)) {
    if (f.endsWith('-VIOLATION.png') && (only.length === 0 || only.some((id) => f.startsWith(id)))) {
      rmSync(path.join(outDir, f));
    }
  }
}
const targets = REELS.filter(([id]) => only.length === 0 || only.includes(id));
if (targets.length === 0) {
  console.error(`No matching reel. Known: ${REELS.map((r) => r[0]).join(', ')}`);
  process.exit(2);
}

// Right rail sits over background/decor in virtually every reel — that is normal
// (IG buttons overlay the background). Pixels cannot tell decor from text, so the
// right zone is advisory here; the code-level assertSafe still hard-enforces it for
// registered critical elements (text/CTA/hero). Top/bottom stay hard failures.
const SEVERITY = QA.severity || {};
let failures = 0;
let warnings = 0;
const report = [];

for (const [id, timelineFile] of targets) {
  const frames = framesFor(timelineFile);
  frames.forEach((frame, idx) => {
    const png = path.join(outDir, `${id}-${String(idx + 1).padStart(2, '0')}.png`);
    if (!skipRender) {
      const res = spawnSync(process.execPath, [remotionCli, 'still', id, png, `--frame=${frame}`], {stdio: 'inherit'});
      if (res.status !== 0) {
        console.error(`✗ render failed: ${id} @${frame}`);
        failures++;
        return;
      }
    }
    if (!existsSync(png)) {
      console.error(`✗ missing frame: ${png}`);
      failures++;
      return;
    }
    const img = decodePng(png);
    if (img.width !== CANVAS.width || img.height !== CANVAS.height) {
      console.error(`✗ ${id} frame is ${img.width}x${img.height}, expected ${CANVAS.width}x${CANVAS.height}`);
    }
    let frameViolated = false;
    for (const [name, zone] of Object.entries(ZONES)) {
      const {fraction} = zoneEnergy(img, zone);
      const over = fraction > QA.maxEdgeFraction;
      const severity = SEVERITY[name] || 'fail';
      const pct = (fraction * 100).toFixed(2);
      if (over && severity === 'fail') {
        frameViolated = true;
        failures++;
        report.push(`✗ ${id} @${frame}: content in IG "${name}" zone (edge ${pct}% > ${(QA.maxEdgeFraction * 100).toFixed(2)}%)`);
      } else if (over) {
        warnings++;
        report.push(`⚠ ${id} @${frame}: content in IG "${name}" zone (edge ${pct}%) — advisory (decor under action rail)`);
      } else {
        report.push(`  ${id} @${frame}: ${name} ok (${pct}%)`);
      }
      paintZone(img, zone, over);
    }
    if (frameViolated) {
      const annotated = path.join(outDir, `${id}-${String(idx + 1).padStart(2, '0')}-VIOLATION.png`);
      writeFileSync(annotated, encodePng(img.width, img.height, img.data));
      report.push(`    → ${path.relative(root, annotated)}`);
    }
  });
}

console.log('\n' + report.join('\n') + '\n');
if (failures > 0) {
  console.error(`SAFE-ZONE GATE FAILED: ${failures} issue(s), ${warnings} advisory.`);
  process.exit(1);
}
console.log(`SAFE-ZONE GATE PASSED.${warnings ? ` (${warnings} advisory right-rail notes)` : ''}`);
