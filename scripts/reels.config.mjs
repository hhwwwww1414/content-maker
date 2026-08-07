/**
 * Manifest of the "explainer" reel series (updated pipeline). One entry per reel;
 * all file paths are derived from `key` by convention:
 *   content/<key>-reel.json
 *   src/generated/timeline-<key>.json
 *   public/generated/voiceover-<key>.wav (+ -metadata.json)
 *   src/generated/captions-<key>.json
 *   out/ghostpepe-<key>-reel.mp4
 *
 * `comp` is the Remotion composition id (registered in src/Root.tsx).
 * `group` lets `scripts/reels.mjs` build subsets (e.g. only the coding batch).
 */
export const REELS = [
  {key: 'vpn-proxy-dns', comp: 'GhostPepeVpnProxyDnsReel', group: 'news'},
  {key: 'free-vpn', comp: 'GhostPepeFreeVpnReel', group: 'news'},
  {key: 'whitelist-cage', comp: 'GhostPepeWhitelistCageReel', group: 'news'},
  {key: 'dpi-fingerprint', comp: 'GhostPepeDpiFingerprintReel', group: 'news'},
  {key: 'internet-passport', comp: 'GhostPepeInternetPassportReel', group: 'news'},
  {key: 'superapp', comp: 'GhostPepeSuperappReel', group: 'news'},
  {key: 'chatcontrol', comp: 'GhostPepeChatControlReel', group: 'news'},
  {key: 'sim-cooldown', comp: 'GhostPepeSimCooldownReel', group: 'news'},

  {key: 'handshake', comp: 'GhostPepeHandshakeReel', group: 'coding'},
  {key: 'tunnel', comp: 'GhostPepeTunnelReel', group: 'coding'},
  {key: 'packets', comp: 'GhostPepePacketsReel', group: 'coding'},
  {key: 'ports', comp: 'GhostPepePortsReel', group: 'coding'},
  {key: 'keys', comp: 'GhostPepeKeysReel', group: 'coding'},
  {key: 'ping', comp: 'GhostPepePingReel', group: 'coding'},

  {key: 'wifi-not-internet', comp: 'GhostPepeWifiNotInternetReel', group: 'series'},

  {key: 'cache', comp: 'GhostPepeCacheReel', group: 'web'},
  {key: 'cookie', comp: 'GhostPepeCookieReel', group: 'web'},
  {key: 'password', comp: 'GhostPepePasswordReel', group: 'web'},
  {key: 'incognito', comp: 'GhostPepeIncognitoReel', group: 'web'},
  {key: 'ip-address', comp: 'GhostPepeIpAddressReel', group: 'web'},
  {key: 'https-lock', comp: 'GhostPepeHttpsLockReel', group: 'web'},
];

export const paths = (key) => ({
  content: `content/${key}-reel.json`,
  timeline: `src/generated/timeline-${key}.json`,
  voice: `public/generated/voiceover-${key}.wav`,
  meta: `public/generated/voiceover-${key}-metadata.json`,
  captions: `src/generated/captions-${key}.json`,
  out: `out/ghostpepe-${key}-reel.mp4`,
});

export const resolve = (selectors) => {
  if (!selectors.length || selectors.includes('all')) return REELS;
  const byGroup = REELS.filter((r) => selectors.includes(r.group));
  const byKey = REELS.filter((r) => selectors.includes(r.key));
  const set = new Map();
  for (const r of [...byGroup, ...byKey]) set.set(r.key, r);
  return [...set.values()];
};
