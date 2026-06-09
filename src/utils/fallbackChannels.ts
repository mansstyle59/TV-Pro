import { Channel } from "../types";

export const FALLBACK_CHANNELS: Channel[] = [
  // 1. TNT / Généralistes
  {
    id: 1001,
    name: "TF1 HD",
    country: "France",
    logo: "https://logos-marques.com/wp-content/uploads/2021/03/TF1-logo.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/tf1.m3u8"
  },
  {
    id: 1002,
    name: "France 2",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/France_2_logo_2018.svg/1024px-France_2_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://direct-f2.akamaized.net/live/g/g1/index.m3u8"
  },
  {
    id: 1003,
    name: "France 3",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/France_3_logo_2018.svg/1200px-France_3_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "720p",
    streamUrl: "https://direct-f3.akamaized.net/live/g/g1/index.m3u8"
  },
  {
    id: 1005,
    name: "France 5",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/France_5_logo_2018.svg/1200px-France_5_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "720p",
    streamUrl: "https://direct-f5.akamaized.net/live/g/g1/index.m3u8"
  },
  {
    id: 1006,
    name: "M6 HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/M6_logo_2009.svg/1200px-M6_logo_2009.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/m6.m3u8"
  },
  {
    id: 1007,
    name: "Arte HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Arte_2017.svg/1200px-Logo_Arte_2017.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://arte-cmaf-prod.akamaized.net/m3u8-live/fr/classic/index.m3u8"
  },
  {
    id: 1008,
    name: "C8 HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/C8_logo_2017.svg/1024px-C8_logo_2017.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/c8.m3u8"
  },
  {
    id: 1009,
    name: "W9 HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/W9_logo_2018.svg/1200px-W9_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/w9.m3u8"
  },
  {
    id: 1010,
    name: "TMC HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/TMC_logo_2016.svg/1200px-TMC_logo_2016.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/tmc.m3u8"
  },
  {
    id: 1011,
    name: "TFX HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/TFX_logo_2018.svg/1200px-TFX_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/tfx.m3u8"
  },
  {
    id: 1012,
    name: "NRJ 12",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/NRJ_12_logo_2014.svg/1200px-NRJ_12_logo_2014.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/nrj12.m3u8"
  },
  {
    id: 1013,
    name: "LCP Assemblée Nationale",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_LCP.svg/1200px-Logo_LCP.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "720p",
    streamUrl: "https://lcp-lh.akamaihd.net/i/lcp_1@3000/master.m3u8"
  },
  {
    id: 1014,
    name: "France 4",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/France_4_logo_2018.svg/1200px-France_4_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "720p",
    streamUrl: "https://direct-f4.akamaized.net/live/g/g1/index.m3u8"
  },
  {
    id: 1015,
    name: "CStar HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/CStar_logo_2017.svg/1200px-CStar_logo_2017.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/cstar.m3u8"
  },
  {
    id: 1016,
    name: "Gulli HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Gulli_logo_2019.svg/1200px-Gulli_logo_2019.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/gulli.m3u8"
  },
  {
    id: 1018,
    name: "L'Equipe d'Estelle",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/L%27%C3%89quipe_logo_2015.svg/1200px-L%27%C3%89quipe_logo_2015.svg.png",
    categoryOverride: "Sports",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/lequipe.m3u8"
  },
  {
    id: 1020,
    name: "RMC Découverte",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/RMC_D%C3%A9couverte_logo_2018.svg/1200px-RMC_D%C3%A9couverte_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/rmc_decouverte.m3u8"
  },
  {
    id: 1021,
    name: "RMC Story",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/RMC_Story_logo_2018.svg/1200px-RMC_Story_logo_2018.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/rmc_story.m3u8"
  },
  {
    id: 1022,
    name: "Chérie 25",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Ch%C3%A9rie_25_logo_2017.svg/1200px-Ch%C3%A9rie_25_logo_2017.svg.png",
    categoryOverride: "TNT & Généralistes",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/cherie_25.m3u8"
  },

  // 2. Actualités
  {
    id: 2001,
    name: "BFM TV",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/BFM_TV_logo_2019.svg/1200px-BFM_TV_logo_2019.svg.png",
    categoryOverride: "Actualités",
    qualityLabel: "720p",
    streamUrl: "https://stream.bfmtv.com/live/index.m3u8"
  },
  {
    id: 2002,
    name: "CNews",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/CNews_logo_2017.svg/1200px-CNews_logo_2017.svg.png",
    categoryOverride: "Actualités",
    qualityLabel: "1080p",
    streamUrl: "https://direct-cnews.canalpluspro.com/live/g/g1/index.m3u8"
  },
  {
    id: 2003,
    name: "LCI",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/LCI_logo_2016.svg/1200px-LCI_logo_2016.svg.png",
    categoryOverride: "Actualités",
    qualityLabel: "720p",
    streamUrl: "https://lci-lh.akamaihd.net/i/lci_1@401053/master.m3u8"
  },
  {
    id: 2004,
    name: "France Info",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/France_info_logo_2016.svg/1200px-France_info_logo_2016.svg.png",
    categoryOverride: "Actualités",
    qualityLabel: "720p",
    streamUrl: "https://direct-finfo.akamaized.net/live/g/g1/index.m3u8"
  },
  {
    id: 2005,
    name: "France 24 French",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/France_24_logo.svg/1200px-France_24_logo.svg.png",
    categoryOverride: "Actualités",
    qualityLabel: "720p",
    streamUrl: "https://static.france24.com/live/F24_FR_LO_HLS/live_web.m3u8"
  },
  {
    id: 2006,
    name: "Euronews French",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Euronews_logo_2016.svg/1200px-Euronews_logo_2016.svg.png",
    categoryOverride: "Actualités",
    qualityLabel: "720p",
    streamUrl: "https://euronews-fr-p3-multiplex.hexaglobe.net/playlist.m3u8"
  },

  // 3. Divertissement & Cinéma
  {
    id: 3001,
    name: "RTL 9 HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/RTL9_logo_2013.svg/1200px-RTL9_logo_2013.svg.png",
    categoryOverride: "Cinéma & Séries",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/rtl9.m3u8"
  },
  {
    id: 3002,
    name: "AB 1 HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/AB1_logo_2013.svg/1200px-AB1_logo_2013.svg.png",
    categoryOverride: "Cinéma & Séries",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/ab1.m3u8"
  },
  {
    id: 3003,
    name: "Action HD",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Action_logo_2014.svg/1200px-Action_logo_2014.svg.png",
    categoryOverride: "Cinéma & Séries",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/channel_action.m3u8"
  },
  {
    id: 3004,
    name: "TF1 Séries Films",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/TF1_S%C3%A9ries_Films_logo_2018.svg/1200px-TF1_S%C3%A9ries_Films_logo_2018.svg.png",
    categoryOverride: "Cinéma & Séries",
    qualityLabel: "1080p",
    streamUrl: "https://lestream.online/stream/tf1_series_films.m3u8"
  },

  // 4. Musique & Sports Extra
  {
    id: 4001,
    name: "Trace Urban",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Trace_Urban_logo_2018.svg/1200px-Trace_Urban_logo_2018.svg.png",
    categoryOverride: "Musique",
    qualityLabel: "720p",
    streamUrl: "https://traceurban-lh.akamaihd.net/i/traceurban_1@3000/master.m3u8"
  },
  {
    id: 4002,
    name: "Trace Latina",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Trace_Latina_logo.svg/1200px-Trace_Latina_logo.svg.png",
    categoryOverride: "Musique",
    qualityLabel: "720p",
    streamUrl: "https://tracelatina-lh.akamaihd.net/i/tracelatina_1@3000/master.m3u8"
  },
  {
    id: 4003,
    name: "NRJ Hits",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/NRJ_Hits_logo_2014.svg/1200px-NRJ_Hits_logo_2014.svg.png",
    categoryOverride: "Musique",
    qualityLabel: "720p",
    streamUrl: "https://s4.v-g.space/hls/nrj_hits/index.m3u8"
  },
  {
    id: 4004,
    name: "Clubbing TV",
    country: "France",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Clubbing_TV_logo.png/1200px-Clubbing_TV_logo.png",
    categoryOverride: "Musique",
    qualityLabel: "1080p",
    streamUrl: "https://clubbingtv.akamaized.net/hls/live/2026360/CBTV_WORLD_HLS_1/master_1080.m3u8"
  }
];

export const getFallbackLcnMap = (): Record<number, number> => {
  const map: Record<number, number> = {};
  // Standard TNT mappings
  map[1001] = 1;  // TF1
  map[1002] = 2;  // France 2
  map[1003] = 3;  // France 3
  map[1005] = 5;  // France 5
  map[1006] = 6;  // M6
  map[1007] = 7;  // Arte
  map[1008] = 8;  // C8
  map[1009] = 9;  // W9
  map[1010] = 10; // TMC
  map[1011] = 11; // TFX
  map[1012] = 12; // NRJ 12
  map[1013] = 13; // LCP
  map[1014] = 14; // France 4
  map[1015] = 15; // CStar
  map[1016] = 16; // Gulli
  map[1018] = 21; // L'Equipe
  map[1020] = 23; // RMC Decouverte
  map[1021] = 24; // RMC Story
  map[1022] = 25; // Cherie 25
  map[2001] = 15; // BFM TV (standard can overlap or map)
  map[2002] = 16; // CNews
  map[2003] = 26; // LCI
  map[2004] = 27; // France Info
  return map;
};
