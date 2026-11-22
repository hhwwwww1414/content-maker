import {Composition,type CalculateMetadataFunction} from 'remotion';
import {GhostPepeReel} from './compositions/GhostPepeReel';
import {GhostPepeGraveyardReel} from './compositions/GhostPepeGraveyardReel';
import {computeGraveyardSceneFrames} from './compositions/graveyardSceneFrames';
import {GhostPepeDeadlineReel} from './compositions/GhostPepeDeadlineReel';
import {GhostPepeDeadlineCover} from './compositions/GhostPepeDeadlineCover';
import {GhostPepeFakeConnectionReel} from './compositions/GhostPepeFakeConnectionReel';
import {GhostPepeQuestReel} from './compositions/GhostPepeQuestReel';
import {GhostPepeWhitelistReel} from './compositions/GhostPepeWhitelistReel';
import {GhostPepeLastPercentReel} from './compositions/GhostPepeLastPercentReel';
import {GhostPepeTimeDrainReel} from './compositions/GhostPepeTimeDrainReel';
import {GhostPepeForeignSimNewsReel} from './compositions/GhostPepeForeignSimNewsReel';
import {GhostPepeTrafficJamReel} from './compositions/GhostPepeTrafficJamReel';
import {GhostPepeDualInternetReel} from './compositions/GhostPepeDualInternetReel';
import {GhostPepeTrafficSignatureReel} from './compositions/GhostPepeTrafficSignatureReel';
import {tsFrames} from './compositions/trafficSignatureSceneFrames';
import {StoryboardContactSheet} from './reel-system/storyboard/storyboard-renderer';
import {GhostPepeTwoNetworksReel, GhostPepeTwoNetworksSilhouette} from './compositions/GhostPepeTwoNetworksReel';
import {GhostPepeVpnProxyDnsReel} from './compositions/GhostPepeVpnProxyDnsReel';
import timelineVpnProxyDns from './generated/timeline-vpn-proxy-dns.json';
import {GhostPepeFreeVpnReel} from './compositions/GhostPepeFreeVpnReel';
import timelineFreeVpn from './generated/timeline-free-vpn.json';
import {GhostPepeWhitelistCageReel} from './compositions/GhostPepeWhitelistCageReel';
import timelineWhitelistCage from './generated/timeline-whitelist-cage.json';
import {GhostPepeDpiFingerprintReel} from './compositions/GhostPepeDpiFingerprintReel';
import timelineDpiFingerprint from './generated/timeline-dpi-fingerprint.json';
import {GhostPepeInternetPassportReel} from './compositions/GhostPepeInternetPassportReel';
import timelineInternetPassport from './generated/timeline-internet-passport.json';
import {GhostPepeSuperappReel} from './compositions/GhostPepeSuperappReel';
import timelineSuperapp from './generated/timeline-superapp.json';
import {GhostPepeChatControlReel} from './compositions/GhostPepeChatControlReel';
import timelineChatControl from './generated/timeline-chatcontrol.json';
import {GhostPepeSimCooldownReel} from './compositions/GhostPepeSimCooldownReel';
import timelineSimCooldown from './generated/timeline-sim-cooldown.json';
import {GhostPepeHandshakeReel} from './compositions/GhostPepeHandshakeReel';
import timelineHandshake from './generated/timeline-handshake.json';
import {GhostPepeTunnelReel} from './compositions/GhostPepeTunnelReel';
import timelineTunnel from './generated/timeline-tunnel.json';
import {GhostPepePacketsReel} from './compositions/GhostPepePacketsReel';
import timelinePackets from './generated/timeline-packets.json';
import {GhostPepePortsReel} from './compositions/GhostPepePortsReel';
import timelinePorts from './generated/timeline-ports.json';
import {GhostPepeKeysReel} from './compositions/GhostPepeKeysReel';
import timelineKeys from './generated/timeline-keys.json';
import {GhostPepePingReel} from './compositions/GhostPepePingReel';
import timelinePing from './generated/timeline-ping.json';
import {GhostPepeWifiNotInternetReel} from './compositions/GhostPepeWifiNotInternetReel';
import {GhostPepeWifiNotInternetCover} from './compositions/GhostPepeWifiNotInternetCover';
import timelineWifiNotInternet from './generated/timeline-wifi-not-internet.json';
import {GhostPepeCacheReel} from './compositions/GhostPepeCacheReel';
import timelineCache from './generated/timeline-cache.json';
import {GhostPepeCookieReel} from './compositions/GhostPepeCookieReel';
import timelineCookie from './generated/timeline-cookie.json';
import {GhostPepePasswordReel} from './compositions/GhostPepePasswordReel';
import timelinePassword from './generated/timeline-password.json';
import {GhostPepeIncognitoReel} from './compositions/GhostPepeIncognitoReel';
import timelineIncognito from './generated/timeline-incognito.json';
import {GhostPepeIpAddressReel} from './compositions/GhostPepeIpAddressReel';
import timelineIpAddress from './generated/timeline-ip-address.json';
import {GhostPepeHttpsLockReel} from './compositions/GhostPepeHttpsLockReel';
import timelineHttpsLock from './generated/timeline-https-lock.json';
import timelineTwoNetworks from './generated/timeline-two-networks.json';
import timeline from './generated/timeline.json';
import timelineDeadline from './generated/timeline-deadline.json';
import timelineFakeConnection from './generated/timeline-fake-connection.json';
import timelineQuest from './generated/timeline-quest.json';
import timelineWhitelist from './generated/timeline-whitelist.json';
import timelineLastPercent from './generated/timeline-last-percent.json';
import timelineTimeDrain from './generated/timeline-time-drain.json';
import timelineForeignSim from './generated/timeline-foreign-sim.json';
import timelineTrafficJam from './generated/timeline-traffic-jam.json';
import timelineDualInternet from './generated/timeline-dual-internet.json';
// --- batch 2026-07-25-a1 ---------------------------------------------------
import {GhostPepeBatch01WifiMigration} from './reels/batch-2026-07-25-a1/01-wifi-migration';
import {GhostPepeBatch02WhitelistPov} from './reels/batch-2026-07-25-a1/02-whitelist-pov';
import {GhostPepeBatch03SniEnvelope} from './reels/batch-2026-07-25-a1/03-sni-envelope';
import {GhostPepeBatch04PacketTooBig} from './reels/batch-2026-07-25-a1/04-packet-too-big';
import {GhostPepeBatch05OutageRitual} from './reels/batch-2026-07-25-a1/05-outage-ritual';
import {GhostPepeBatch06ReroutedMap} from './reels/batch-2026-07-25-a1/06-rerouted-map';
import batch01 from './generated/timeline-batch01-wifi-migration.json';
import batch02 from './generated/timeline-batch02-whitelist-pov.json';
import batch03 from './generated/timeline-batch03-sni-envelope.json';
import batch04 from './generated/timeline-batch04-packet-too-big.json';
import batch05 from './generated/timeline-batch05-outage-ritual.json';
import batch06 from './generated/timeline-batch06-rerouted-map.json';
// --- batch 2026-07-25-b1: engineering elegance behind a VPN ----------------
import {GhostPepeCraftPaintSecret} from './reels/batch-2026-07-25-b1/01-paint-secret';
import {GhostPepeCraftXorSwitch} from './reels/batch-2026-07-25-b1/02-xor-switch';
import {GhostPepeCraftBoxInBox} from './reels/batch-2026-07-25-b1/03-box-in-box';
import {GhostPepeCraftAvalanche} from './reels/batch-2026-07-25-b1/04-avalanche';
import {GhostPepeCraftConciergeLedger} from './reels/batch-2026-07-25-b1/05-concierge-ledger';
import {GhostPepeCraftTwoTimers} from './reels/batch-2026-07-25-b1/06-two-timers';
import craft01 from './generated/timeline-craft01-paint-secret.json';
import craft02 from './generated/timeline-craft02-xor-switch.json';
import craft03 from './generated/timeline-craft03-box-in-box.json';
import craft04 from './generated/timeline-craft04-avalanche.json';
import craft05 from './generated/timeline-craft05-concierge-ledger.json';
import craft06 from './generated/timeline-craft06-two-timers.json';
// --- vibe coding / trust (light canvas, ElevenLabs voiceover) ---------------
import {VibeCodingTrustReel} from './compositions/VibeCodingTrustReel';
import {VibeCodingTrustContactSheet} from './compositions/VibeCodingTrustContactSheet';
import timelineVibeCodingTrust from './generated/timeline-vibe-coding-trust.json';
// --- vpn / age verification (looping video background) ----------------------
import {VpnAgeVerificationReel} from './compositions/VpnAgeVerificationReel';
import {VpnAgeVerificationContactSheet} from './compositions/VpnAgeVerificationContactSheet';
import timelineVpnAgeVerification from './generated/timeline-vpn-age-verification.json';
// --- ai cheated on its test (looping video background) ----------------------
import {AiCheatedTestReel} from './compositions/AiCheatedTestReel';
import {AiCheatedTestContactSheet} from './compositions/AiCheatedTestContactSheet';
import timelineAiCheatedTest from './generated/timeline-ai-cheated-test.json';
// --- website controls ai / indirect prompt injection (looping video background) --
import {WebsiteControlsAiReel} from './compositions/WebsiteControlsAiReel';
import {WebsiteControlsAiContactSheet} from './compositions/WebsiteControlsAiContactSheet';
import timelineWebsiteControlsAi from './generated/timeline-website-controls-ai.json';
// --- how sites detect vpn (looping video background) -------------------------
import {HowSitesDetectVpnReel} from './compositions/HowSitesDetectVpnReel';
import {HowSitesDetectVpnContactSheet} from './compositions/HowSitesDetectVpnContactSheet';
import timelineHowSitesDetectVpn from './generated/timeline-how-sites-detect-vpn.json';
// --- passkey explained (looping video background) ----------------------------
import {PasskeyExplainedReel} from './compositions/PasskeyExplainedReel';
import {PasskeyExplainedContactSheet} from './compositions/PasskeyExplainedContactSheet';
import timelinePasskeyExplained from './generated/timeline-passkey-explained.json';
// --- agentic browser hijack (looping video background) ------------------------
import {AiBrowserHijackReel} from './compositions/AiBrowserHijackReel';
import {AiBrowserHijackContactSheet} from './compositions/AiBrowserHijackContactSheet';
import timelineAiBrowserHijack from './generated/timeline-ai-browser-hijack.json';
// --- ai-voice-scam-48k (grammar-driven) ---
import {AiVoiceScam48kReel} from './compositions/AiVoiceScam48kReel';
import {AiVoiceScam48kContactSheet} from './compositions/AiVoiceScam48kContactSheet';
import timelineAiVoiceScam48k from './generated/timeline-ai-voice-scam-48k.json';
// --- browser-introduces-itself (grammar-driven) ---
import {BrowserIntroducesItselfReel} from './compositions/BrowserIntroducesItselfReel';
import {BrowserIntroducesItselfContactSheet} from './compositions/BrowserIntroducesItselfContactSheet';
import timelineBrowserIntroducesItself from './generated/timeline-browser-introduces-itself.json';
// --- eleven-lines-broke-internet (grammar-driven) ---
import {ElevenLinesBrokeInternetReel} from './compositions/ElevenLinesBrokeInternetReel';
import {ElevenLinesBrokeInternetContactSheet} from './compositions/ElevenLinesBrokeInternetContactSheet';
import timelineElevenLinesBrokeInternet from './generated/timeline-eleven-lines-broke-internet.json';
// --- why-software-is-never-done (grammar-driven) ---
import {WhySoftwareIsNeverDoneReel} from './compositions/WhySoftwareIsNeverDoneReel';
import {WhySoftwareIsNeverDoneContactSheet} from './compositions/WhySoftwareIsNeverDoneContactSheet';
import timelineWhySoftwareIsNeverDone from './generated/timeline-why-software-is-never-done.json';
// --- claude-watermark (grammar-driven) ---
import {ClaudeWatermarkReel} from './compositions/ClaudeWatermarkReel';
import {ClaudeWatermarkContactSheet} from './compositions/ClaudeWatermarkContactSheet';
import timelineClaudeWatermark from './generated/timeline-claude-watermark.json';
// --- tv-watches-you (grammar-driven) ---
import {TvWatchesYouReel} from './compositions/TvWatchesYouReel';
import {TvWatchesYouContactSheet} from './compositions/TvWatchesYouContactSheet';
import timelineTvWatchesYou from './generated/timeline-tv-watches-you.json';
// --- droppers (grammar-driven) ---
import {DroppersReel} from './compositions/DroppersReel';
import {DroppersContactSheet} from './compositions/DroppersContactSheet';
import timelineDroppers from './generated/timeline-droppers.json';
// --- safe-account-scam (grammar-driven) ---
import {SafeAccountScamReel} from './compositions/SafeAccountScamReel';
import {SafeAccountScamContactSheet} from './compositions/SafeAccountScamContactSheet';
import timelineSafeAccountScam from './generated/timeline-safe-account-scam.json';
// --- flat-back-to-seller (grammar-driven) ---
import {FlatBackToSellerReel} from './compositions/FlatBackToSellerReel';
import {FlatBackToSellerContactSheet} from './compositions/FlatBackToSellerContactSheet';
import timelineFlatBackToSeller from './generated/timeline-flat-back-to-seller.json';
// --- credit-self-ban (grammar-driven) ---
import {CreditSelfBanReel} from './compositions/CreditSelfBanReel';
import {CreditSelfBanContactSheet} from './compositions/CreditSelfBanContactSheet';
import timelineCreditSelfBan from './generated/timeline-credit-self-ban.json';
// --- drug-market-shift (grammar-driven) ---
import {DrugMarketShiftReel} from './compositions/DrugMarketShiftReel';
import {DrugMarketShiftContactSheet} from './compositions/DrugMarketShiftContactSheet';
import timelineDrugMarketShift from './generated/timeline-drug-market-shift.json';
const calculateMetadata:CalculateMetadataFunction<Record<string,unknown>>=async()=>({durationInFrames:timeline.durationInFrames,defaultOutName:'ghostpepe-reel.mp4',defaultCodec:'h264'});
const graveyard = computeGraveyardSceneFrames();
export const RemotionRoot:React.FC=()=> <>
  <Composition id="GhostPepeReel" component={GhostPepeReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={timeline.width} height={timeline.height} calculateMetadata={calculateMetadata}/>
  <Composition id="GhostPepeGraveyardReel" component={GhostPepeGraveyardReel} durationInFrames={graveyard.durationInFrames} fps={graveyard.fps} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="GhostPepeDeadlineReel" component={GhostPepeDeadlineReel} durationInFrames={timelineDeadline.durationInFrames} fps={timelineDeadline.fps} width={timelineDeadline.width} height={timelineDeadline.height} defaultProps={{}}/>
  <Composition id="GhostPepeDeadlineCover" component={GhostPepeDeadlineCover} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="GhostPepeFakeConnectionReel" component={GhostPepeFakeConnectionReel} durationInFrames={timelineFakeConnection.durationInFrames} fps={timelineFakeConnection.fps} width={timelineFakeConnection.width} height={timelineFakeConnection.height} defaultProps={{}}/>
  <Composition id="GhostPepeQuestReel" component={GhostPepeQuestReel} durationInFrames={timelineQuest.durationInFrames} fps={timelineQuest.fps} width={timelineQuest.width} height={timelineQuest.height} defaultProps={{}}/>
  <Composition id="GhostPepeWhitelistReel" component={GhostPepeWhitelistReel} durationInFrames={timelineWhitelist.durationInFrames} fps={timelineWhitelist.fps} width={timelineWhitelist.width} height={timelineWhitelist.height} defaultProps={{}}/>
  <Composition id="GhostPepeLastPercentReel" component={GhostPepeLastPercentReel} durationInFrames={timelineLastPercent.durationInFrames} fps={timelineLastPercent.fps} width={timelineLastPercent.width} height={timelineLastPercent.height} defaultProps={{}}/>
  <Composition id="GhostPepeTimeDrainReel" component={GhostPepeTimeDrainReel} durationInFrames={timelineTimeDrain.durationInFrames} fps={timelineTimeDrain.fps} width={timelineTimeDrain.width} height={timelineTimeDrain.height} defaultProps={{}}/>
  <Composition id="GhostPepeForeignSimNewsReel" component={GhostPepeForeignSimNewsReel} durationInFrames={timelineForeignSim.durationInFrames} fps={timelineForeignSim.fps} width={timelineForeignSim.width} height={timelineForeignSim.height} defaultProps={{}}/>
  <Composition id="GhostPepeTrafficJamReel" component={GhostPepeTrafficJamReel} durationInFrames={timelineTrafficJam.durationInFrames} fps={timelineTrafficJam.fps} width={timelineTrafficJam.width} height={timelineTrafficJam.height} defaultProps={{}}/>
  <Composition id="GhostPepeDualInternetReel" component={GhostPepeDualInternetReel} durationInFrames={timelineDualInternet.durationInFrames} fps={timelineDualInternet.fps} width={timelineDualInternet.width} height={timelineDualInternet.height} defaultProps={{}}/>
  <Composition id="GhostPepeTrafficSignatureReel" component={GhostPepeTrafficSignatureReel} durationInFrames={tsFrames.durationInFrames} fps={tsFrames.fps} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="GhostPepeStoryboardPreview" component={StoryboardContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="GhostPepeTwoNetworksReel" component={GhostPepeTwoNetworksReel} durationInFrames={timelineTwoNetworks.durationInFrames} fps={timelineTwoNetworks.fps} width={timelineTwoNetworks.width} height={timelineTwoNetworks.height} defaultProps={{}}/>
  <Composition id="GhostPepeTwoNetworksSilhouette" component={GhostPepeTwoNetworksSilhouette} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="GhostPepeVpnProxyDnsReel" component={GhostPepeVpnProxyDnsReel} durationInFrames={timelineVpnProxyDns.durationInFrames} fps={timelineVpnProxyDns.fps} width={timelineVpnProxyDns.width} height={timelineVpnProxyDns.height} defaultProps={{}}/>
  <Composition id="GhostPepeFreeVpnReel" component={GhostPepeFreeVpnReel} durationInFrames={timelineFreeVpn.durationInFrames} fps={timelineFreeVpn.fps} width={timelineFreeVpn.width} height={timelineFreeVpn.height} defaultProps={{}}/>
  <Composition id="GhostPepeWhitelistCageReel" component={GhostPepeWhitelistCageReel} durationInFrames={timelineWhitelistCage.durationInFrames} fps={timelineWhitelistCage.fps} width={timelineWhitelistCage.width} height={timelineWhitelistCage.height} defaultProps={{}}/>
  <Composition id="GhostPepeDpiFingerprintReel" component={GhostPepeDpiFingerprintReel} durationInFrames={timelineDpiFingerprint.durationInFrames} fps={timelineDpiFingerprint.fps} width={timelineDpiFingerprint.width} height={timelineDpiFingerprint.height} defaultProps={{}}/>
  <Composition id="GhostPepeInternetPassportReel" component={GhostPepeInternetPassportReel} durationInFrames={timelineInternetPassport.durationInFrames} fps={timelineInternetPassport.fps} width={timelineInternetPassport.width} height={timelineInternetPassport.height} defaultProps={{}}/>
  <Composition id="GhostPepeSuperappReel" component={GhostPepeSuperappReel} durationInFrames={timelineSuperapp.durationInFrames} fps={timelineSuperapp.fps} width={timelineSuperapp.width} height={timelineSuperapp.height} defaultProps={{}}/>
  <Composition id="GhostPepeChatControlReel" component={GhostPepeChatControlReel} durationInFrames={timelineChatControl.durationInFrames} fps={timelineChatControl.fps} width={timelineChatControl.width} height={timelineChatControl.height} defaultProps={{}}/>
  <Composition id="GhostPepeSimCooldownReel" component={GhostPepeSimCooldownReel} durationInFrames={timelineSimCooldown.durationInFrames} fps={timelineSimCooldown.fps} width={timelineSimCooldown.width} height={timelineSimCooldown.height} defaultProps={{}}/>
  <Composition id="GhostPepeHandshakeReel" component={GhostPepeHandshakeReel} durationInFrames={timelineHandshake.durationInFrames} fps={timelineHandshake.fps} width={timelineHandshake.width} height={timelineHandshake.height} defaultProps={{}}/>
  <Composition id="GhostPepeTunnelReel" component={GhostPepeTunnelReel} durationInFrames={timelineTunnel.durationInFrames} fps={timelineTunnel.fps} width={timelineTunnel.width} height={timelineTunnel.height} defaultProps={{}}/>
  <Composition id="GhostPepePacketsReel" component={GhostPepePacketsReel} durationInFrames={timelinePackets.durationInFrames} fps={timelinePackets.fps} width={timelinePackets.width} height={timelinePackets.height} defaultProps={{}}/>
  <Composition id="GhostPepePortsReel" component={GhostPepePortsReel} durationInFrames={timelinePorts.durationInFrames} fps={timelinePorts.fps} width={timelinePorts.width} height={timelinePorts.height} defaultProps={{}}/>
  <Composition id="GhostPepeKeysReel" component={GhostPepeKeysReel} durationInFrames={timelineKeys.durationInFrames} fps={timelineKeys.fps} width={timelineKeys.width} height={timelineKeys.height} defaultProps={{}}/>
  <Composition id="GhostPepePingReel" component={GhostPepePingReel} durationInFrames={timelinePing.durationInFrames} fps={timelinePing.fps} width={timelinePing.width} height={timelinePing.height} defaultProps={{}}/>
  <Composition id="GhostPepeWifiNotInternetReel" component={GhostPepeWifiNotInternetReel} durationInFrames={timelineWifiNotInternet.durationInFrames} fps={timelineWifiNotInternet.fps} width={timelineWifiNotInternet.width} height={timelineWifiNotInternet.height} defaultProps={{}}/>
  <Composition id="GhostPepeWifiNotInternetCover" component={GhostPepeWifiNotInternetCover} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="GhostPepeCacheReel" component={GhostPepeCacheReel} durationInFrames={timelineCache.durationInFrames} fps={timelineCache.fps} width={timelineCache.width} height={timelineCache.height} defaultProps={{}}/>
  <Composition id="GhostPepeCookieReel" component={GhostPepeCookieReel} durationInFrames={timelineCookie.durationInFrames} fps={timelineCookie.fps} width={timelineCookie.width} height={timelineCookie.height} defaultProps={{}}/>
  <Composition id="GhostPepePasswordReel" component={GhostPepePasswordReel} durationInFrames={timelinePassword.durationInFrames} fps={timelinePassword.fps} width={timelinePassword.width} height={timelinePassword.height} defaultProps={{}}/>
  <Composition id="GhostPepeIncognitoReel" component={GhostPepeIncognitoReel} durationInFrames={timelineIncognito.durationInFrames} fps={timelineIncognito.fps} width={timelineIncognito.width} height={timelineIncognito.height} defaultProps={{}}/>
  <Composition id="GhostPepeIpAddressReel" component={GhostPepeIpAddressReel} durationInFrames={timelineIpAddress.durationInFrames} fps={timelineIpAddress.fps} width={timelineIpAddress.width} height={timelineIpAddress.height} defaultProps={{}}/>
  <Composition id="GhostPepeHttpsLockReel" component={GhostPepeHttpsLockReel} durationInFrames={timelineHttpsLock.durationInFrames} fps={timelineHttpsLock.fps} width={timelineHttpsLock.width} height={timelineHttpsLock.height} defaultProps={{}}/>
  <Composition id="GhostPepeBatch01WifiMigration" component={GhostPepeBatch01WifiMigration} durationInFrames={batch01.durationInFrames} fps={batch01.fps} width={batch01.width} height={batch01.height} defaultProps={{}}/>
  <Composition id="GhostPepeBatch02WhitelistPov" component={GhostPepeBatch02WhitelistPov} durationInFrames={batch02.durationInFrames} fps={batch02.fps} width={batch02.width} height={batch02.height} defaultProps={{}}/>
  <Composition id="GhostPepeBatch03SniEnvelope" component={GhostPepeBatch03SniEnvelope} durationInFrames={batch03.durationInFrames} fps={batch03.fps} width={batch03.width} height={batch03.height} defaultProps={{}}/>
  <Composition id="GhostPepeBatch04PacketTooBig" component={GhostPepeBatch04PacketTooBig} durationInFrames={batch04.durationInFrames} fps={batch04.fps} width={batch04.width} height={batch04.height} defaultProps={{}}/>
  <Composition id="GhostPepeBatch05OutageRitual" component={GhostPepeBatch05OutageRitual} durationInFrames={batch05.durationInFrames} fps={batch05.fps} width={batch05.width} height={batch05.height} defaultProps={{}}/>
  <Composition id="GhostPepeBatch06ReroutedMap" component={GhostPepeBatch06ReroutedMap} durationInFrames={batch06.durationInFrames} fps={batch06.fps} width={batch06.width} height={batch06.height} defaultProps={{}}/>
  <Composition id="GhostPepeCraftPaintSecret" component={GhostPepeCraftPaintSecret} durationInFrames={craft01.durationInFrames} fps={craft01.fps} width={craft01.width} height={craft01.height} defaultProps={{}}/>
  <Composition id="GhostPepeCraftXorSwitch" component={GhostPepeCraftXorSwitch} durationInFrames={craft02.durationInFrames} fps={craft02.fps} width={craft02.width} height={craft02.height} defaultProps={{}}/>
  <Composition id="GhostPepeCraftBoxInBox" component={GhostPepeCraftBoxInBox} durationInFrames={craft03.durationInFrames} fps={craft03.fps} width={craft03.width} height={craft03.height} defaultProps={{}}/>
  <Composition id="GhostPepeCraftAvalanche" component={GhostPepeCraftAvalanche} durationInFrames={craft04.durationInFrames} fps={craft04.fps} width={craft04.width} height={craft04.height} defaultProps={{}}/>
  <Composition id="GhostPepeCraftConciergeLedger" component={GhostPepeCraftConciergeLedger} durationInFrames={craft05.durationInFrames} fps={craft05.fps} width={craft05.width} height={craft05.height} defaultProps={{}}/>
  <Composition id="GhostPepeCraftTwoTimers" component={GhostPepeCraftTwoTimers} durationInFrames={craft06.durationInFrames} fps={craft06.fps} width={craft06.width} height={craft06.height} defaultProps={{}}/>
  <Composition id="VibeCodingTrustReel" component={VibeCodingTrustReel} durationInFrames={timelineVibeCodingTrust.durationInFrames} fps={timelineVibeCodingTrust.fps} width={timelineVibeCodingTrust.width} height={timelineVibeCodingTrust.height} defaultProps={{}}/>
  <Composition id="VpnAgeVerificationReel" component={VpnAgeVerificationReel} durationInFrames={timelineVpnAgeVerification.durationInFrames} fps={timelineVpnAgeVerification.fps} width={timelineVpnAgeVerification.width} height={timelineVpnAgeVerification.height} defaultProps={{}}/>
  <Composition id="VpnAgeVerificationContactSheet" component={VpnAgeVerificationContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="VibeCodingTrustContactSheet" component={VibeCodingTrustContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="AiCheatedTestReel" component={AiCheatedTestReel} durationInFrames={timelineAiCheatedTest.durationInFrames} fps={timelineAiCheatedTest.fps} width={timelineAiCheatedTest.width} height={timelineAiCheatedTest.height} defaultProps={{}}/>
  <Composition id="AiCheatedTestContactSheet" component={AiCheatedTestContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="WebsiteControlsAiReel" component={WebsiteControlsAiReel} durationInFrames={timelineWebsiteControlsAi.durationInFrames} fps={timelineWebsiteControlsAi.fps} width={timelineWebsiteControlsAi.width} height={timelineWebsiteControlsAi.height} defaultProps={{}}/>
  <Composition id="WebsiteControlsAiContactSheet" component={WebsiteControlsAiContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="HowSitesDetectVpnReel" component={HowSitesDetectVpnReel} durationInFrames={timelineHowSitesDetectVpn.durationInFrames} fps={timelineHowSitesDetectVpn.fps} width={timelineHowSitesDetectVpn.width} height={timelineHowSitesDetectVpn.height} defaultProps={{}}/>
  <Composition id="HowSitesDetectVpnContactSheet" component={HowSitesDetectVpnContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="PasskeyExplainedReel" component={PasskeyExplainedReel} durationInFrames={timelinePasskeyExplained.durationInFrames} fps={timelinePasskeyExplained.fps} width={timelinePasskeyExplained.width} height={timelinePasskeyExplained.height} defaultProps={{}}/>
  <Composition id="PasskeyExplainedContactSheet" component={PasskeyExplainedContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="AiBrowserHijackReel" component={AiBrowserHijackReel} durationInFrames={timelineAiBrowserHijack.durationInFrames} fps={timelineAiBrowserHijack.fps} width={timelineAiBrowserHijack.width} height={timelineAiBrowserHijack.height} defaultProps={{}}/>
  <Composition id="AiBrowserHijackContactSheet" component={AiBrowserHijackContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="AiVoiceScam48kReel" component={AiVoiceScam48kReel} durationInFrames={timelineAiVoiceScam48k.durationInFrames} fps={timelineAiVoiceScam48k.fps} width={timelineAiVoiceScam48k.width} height={timelineAiVoiceScam48k.height} defaultProps={{}}/>
  <Composition id="AiVoiceScam48kContactSheet" component={AiVoiceScam48kContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="BrowserIntroducesItselfReel" component={BrowserIntroducesItselfReel} durationInFrames={timelineBrowserIntroducesItself.durationInFrames} fps={timelineBrowserIntroducesItself.fps} width={timelineBrowserIntroducesItself.width} height={timelineBrowserIntroducesItself.height} defaultProps={{}}/>
  <Composition id="BrowserIntroducesItselfContactSheet" component={BrowserIntroducesItselfContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="ElevenLinesBrokeInternetReel" component={ElevenLinesBrokeInternetReel} durationInFrames={timelineElevenLinesBrokeInternet.durationInFrames} fps={timelineElevenLinesBrokeInternet.fps} width={timelineElevenLinesBrokeInternet.width} height={timelineElevenLinesBrokeInternet.height} defaultProps={{}}/>
  <Composition id="ElevenLinesBrokeInternetContactSheet" component={ElevenLinesBrokeInternetContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="WhySoftwareIsNeverDoneReel" component={WhySoftwareIsNeverDoneReel} durationInFrames={timelineWhySoftwareIsNeverDone.durationInFrames} fps={timelineWhySoftwareIsNeverDone.fps} width={timelineWhySoftwareIsNeverDone.width} height={timelineWhySoftwareIsNeverDone.height} defaultProps={{}}/>
  <Composition id="WhySoftwareIsNeverDoneContactSheet" component={WhySoftwareIsNeverDoneContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="ClaudeWatermarkReel" component={ClaudeWatermarkReel} durationInFrames={timelineClaudeWatermark.durationInFrames} fps={timelineClaudeWatermark.fps} width={timelineClaudeWatermark.width} height={timelineClaudeWatermark.height} defaultProps={{}}/>
  <Composition id="ClaudeWatermarkContactSheet" component={ClaudeWatermarkContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="TvWatchesYouReel" component={TvWatchesYouReel} durationInFrames={timelineTvWatchesYou.durationInFrames} fps={timelineTvWatchesYou.fps} width={timelineTvWatchesYou.width} height={timelineTvWatchesYou.height} defaultProps={{}}/>
  <Composition id="TvWatchesYouContactSheet" component={TvWatchesYouContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="DroppersReel" component={DroppersReel} durationInFrames={timelineDroppers.durationInFrames} fps={timelineDroppers.fps} width={timelineDroppers.width} height={timelineDroppers.height} defaultProps={{}}/>
  <Composition id="DroppersContactSheet" component={DroppersContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="SafeAccountScamReel" component={SafeAccountScamReel} durationInFrames={timelineSafeAccountScam.durationInFrames} fps={timelineSafeAccountScam.fps} width={timelineSafeAccountScam.width} height={timelineSafeAccountScam.height} defaultProps={{}}/>
  <Composition id="SafeAccountScamContactSheet" component={SafeAccountScamContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="FlatBackToSellerReel" component={FlatBackToSellerReel} durationInFrames={timelineFlatBackToSeller.durationInFrames} fps={timelineFlatBackToSeller.fps} width={timelineFlatBackToSeller.width} height={timelineFlatBackToSeller.height} defaultProps={{}}/>
  <Composition id="FlatBackToSellerContactSheet" component={FlatBackToSellerContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="CreditSelfBanReel" component={CreditSelfBanReel} durationInFrames={timelineCreditSelfBan.durationInFrames} fps={timelineCreditSelfBan.fps} width={timelineCreditSelfBan.width} height={timelineCreditSelfBan.height} defaultProps={{}}/>
  <Composition id="CreditSelfBanContactSheet" component={CreditSelfBanContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
  <Composition id="DrugMarketShiftReel" component={DrugMarketShiftReel} durationInFrames={timelineDrugMarketShift.durationInFrames} fps={timelineDrugMarketShift.fps} width={timelineDrugMarketShift.width} height={timelineDrugMarketShift.height} defaultProps={{}}/>
  <Composition id="DrugMarketShiftContactSheet" component={DrugMarketShiftContactSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>
</>;
