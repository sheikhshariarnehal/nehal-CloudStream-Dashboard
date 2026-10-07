export interface ProviderInfo {
  name: string;
  type: string;
  region: string;
  category: string;
}

export const ALL_PROVIDERS: ProviderInfo[] = [
  { name: 'MovieBoxProviderIN', type: 'Movies & Series', region: 'Global', category: 'Movies' },
  { name: 'VegaMovies', type: 'Dual Audio & HD', region: 'India / Global', category: 'HD Movies' },
  { name: 'CastleTvProvider', type: 'Live TV & VOD', region: 'India / BD', category: 'Live TV' },
  { name: 'FTPBD', type: 'BDIX Fast Stream', region: 'Bangladesh', category: 'BDIX' },
  { name: 'CineplexBD', type: 'Bangla Cinema', region: 'Bangladesh', category: 'Bangla' },
  { name: 'AnimeDekhoProvider', type: 'Anime & Dub', region: 'India / Global', category: 'Anime' },
  { name: 'AllWish', type: 'Anime & Movies', region: 'Global', category: 'Anime' },
  { name: 'Aniwatch', type: 'Anime Sub / Dub', region: 'Global', category: 'Anime' },
  { name: 'BanglaPlex', type: 'Bangla Media Hub', region: 'Bangladesh', category: 'Bangla' },
  { name: 'BdixCircleftp', type: 'BDIX FTP Stream', region: 'Bangladesh', category: 'BDIX' },
  { name: 'BdixCircleFtpOld', type: 'BDIX Archive', region: 'Bangladesh', category: 'BDIX' },
  { name: 'BdixICCFtp', type: 'BDIX Media Hub', region: 'Bangladesh', category: 'BDIX' },
  { name: 'CTGMovies', type: 'Regional Movies', region: 'Bangladesh', category: 'Bangla' },
  { name: 'DhakaFlix', type: 'BDIX Streaming', region: 'Bangladesh', category: 'BDIX' },
  { name: 'DhakaFlixBDIX', type: 'BDIX Dedicated', region: 'Bangladesh', category: 'BDIX' },
  { name: 'DiscoveryFTP', type: 'FTP Content Hub', region: 'Bangladesh', category: 'BDIX' },
  { name: 'FmFtp', type: 'FTP Media Server', region: 'Bangladesh', category: 'BDIX' },
  { name: 'FTPBDMedia', type: 'FTP Fast Mirror', region: 'Bangladesh', category: 'BDIX' },
  { name: 'JellyfinBD', type: 'Private Media Server', region: 'Bangladesh', category: 'Private Server' },
  { name: 'MojaLoss', type: 'Entertainment Stream', region: 'Bangladesh', category: 'Entertainment' },
  { name: 'MovieLinkBDProvider', type: 'Movie Direct Links', region: 'Bangladesh', category: 'Direct Links' },
  { name: 'Netmirror', type: 'Multi-VOD Mirrors', region: 'Global', category: 'Multi VOD' },
  { name: 'ShowTimeBD', type: 'Bangla ShowTime', region: 'Bangladesh', category: 'Bangla' },
];
