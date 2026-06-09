import { Channel, EpgProgramme } from "../types";
import { getApiUrl } from "./urlHelper";

export interface XtreamAccountInfo {
  username: string;
  status: string;
  expiryDate: string;
  maxConnections: number;
  activeConnections: number;
  serverUrl: string;
  createdAt: string;
}

// Global cached connection details
export function getSavedXtreamCredentials() {
  const server = localStorage.getItem("xtream_server") || "";
  const username = localStorage.getItem("xtream_username") || "";
  const password = localStorage.getItem("xtream_password") || "";
  const enabled = localStorage.getItem("xtream_enabled") === "true";
  const useCorsProxy = localStorage.getItem("xtream_cors_proxy") === "true";
  
  return { server, username, password, enabled, useCorsProxy };
}

export function saveXtreamCredentials(server: string, username: string, password: string, useCorsProxy: boolean) {
  localStorage.setItem("xtream_server", server.trim().replace(/\/$/, ""));
  localStorage.setItem("xtream_username", username.trim());
  localStorage.setItem("xtream_password", password.trim());
  localStorage.setItem("xtream_cors_proxy", useCorsProxy ? "true" : "false");
}

export function setXtreamEnabled(enabled: boolean) {
  localStorage.setItem("xtream_enabled", enabled ? "true" : "false");
}

// Generates the proper URL taking CORS proxy into consideration if running client-only
function buildUrl(url: string, useProxy: boolean): string {
  if (useProxy) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// Logs in and retrieves subscription details from the Xtream Codes server
export async function authenticateXtream(): Promise<{ success: boolean; accountInfo?: XtreamAccountInfo; error?: string }> {
  const { server, username, password, useCorsProxy } = getSavedXtreamCredentials();
  if (!server || !username || !password) {
    return { success: false, error: "Identifiants Xtream Codes manquants" };
  }

  try {
    const rawUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const targetUrl = buildUrl(rawUrl, useCorsProxy);
    
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (data && data.user_info) {
      const userInfo = data.user_info;
      
      const expDate = userInfo.exp_date 
        ? (userInfo.exp_date === "null" || isNaN(Number(userInfo.exp_date)) 
            ? "Illimité" 
            : new Date(Number(userInfo.exp_date) * 1000).toLocaleDateString("fr-FR"))
        : "Inconnu";

      const createdAt = userInfo.created_at 
        ? (userInfo.created_at === "null" || isNaN(Number(userInfo.created_at)) 
            ? "Inconnue" 
            : new Date(Number(userInfo.created_at) * 1000).toLocaleDateString("fr-FR"))
        : "Inconnue";

      return {
        success: true,
        accountInfo: {
          username: userInfo.username || username,
          status: userInfo.status || "Active",
          expiryDate: expDate,
          maxConnections: Number(userInfo.max_connections || 1),
          activeConnections: Number(userInfo.active_cons || 0),
          serverUrl: server,
          createdAt: createdAt
        }
      };
    } else {
      return { success: false, error: "Identifiants incorrects ou serveur indisponible" };
    }
  } catch (err: any) {
    console.error("Xtream auth failed:", err);
    return { success: false, error: `Impossible de joindre le serveur. Vérifiez l'adresse ou essayez d'activer le contournement CORS.` };
  }
}

// Load Categories mapping
export async function fetchXtreamCategories(): Promise<Record<string, string>> {
  const { server, username, password, useCorsProxy } = getSavedXtreamCredentials();
  const categoryMap: Record<string, string> = {};
  
  if (!server || !username || !password) return categoryMap;
  
  try {
    const rawUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`;
    const targetUrl = buildUrl(rawUrl, useCorsProxy);
    
    const response = await fetch(targetUrl);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((cat: any) => {
          if (cat.category_id && cat.category_name) {
            categoryMap[cat.category_id.toString()] = cat.category_name;
          }
        });
      }
    }
  } catch (err) {
    console.warn("Could not load Xtream categories:", err);
  }
  
  return categoryMap;
}

// Fetch channels list from Xtream Codes server and map them to our internal Channel format
export async function fetchXtreamChannels(): Promise<Channel[]> {
  const { server, username, password, useCorsProxy } = getSavedXtreamCredentials();
  if (!server || !username || !password) return [];
  
  try {
    // 1. Fetch live categories to resolve string names
    const categories = await fetchXtreamCategories();
    
    // 2. Fetch live stream items
    const rawUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
    const targetUrl = buildUrl(rawUrl, useCorsProxy);
    
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    
    // 3. Map Xtream channel scheme to React internal Channel scheme
    const mapped: Channel[] = data.map((item: any) => {
      const streamId = item.stream_id;
      const originalName = item.name || "Chaîne Sans Nom";
      
      // Extract clean name and quality labels (HD, FHD, 4K)
      let name = originalName;
      let qualityLabel = "HD";
      if (originalName.toLowerCase().includes("fhd") || originalName.toLowerCase().includes("1080p")) {
        qualityLabel = "FHD";
      } else if (originalName.toLowerCase().includes("4k") || originalName.toLowerCase().includes("uhd")) {
        qualityLabel = "4K";
      } else if (originalName.toLowerCase().includes("sd") || originalName.toLowerCase().includes("576p")) {
        qualityLabel = "SD";
      }
      
      // Strip common prefixes from the name for a polished UI
      name = name
        .replace(/^[\[|\(]?(FR|BE|CH|CH-FR|TNT|VIP|BACKUP|HD|FHD|4K|SD)[\]|\)]?/gi, "")
        .replace(/^\s*[:-|•]\s*/g, "")
        .trim();
      
      // Resolve category override
      const categoryIdStr = item.category_id ? item.category_id.toString() : "";
      const categoryName = categories[categoryIdStr] || "Chaînes Importées";
      
      // Native stream playback URL (standard for Xtream is live/user/password/id.ts)
      // Some providers support standard .ts stream, which is supported by hls-player!
      const streamUrl = `${server}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.ts`;
      
      return {
        id: Number(streamId),
        name: name,
        logo: item.stream_icon || "",
        country: "Xtream Live",
        categoryOverride: categoryName,
        qualityLabel: qualityLabel,
        streamUrl: streamUrl,
        groupTitle: categoryName
      };
    });

    // 4. Batch query back-end logos from github/iptv-org cache to enrich empty or poor quality logos
    try {
      const namesToLookup = Array.from(
        new Set(
          mapped
            .filter(ch => !ch.logo || ch.logo.includes("placeholder") || ch.logo === "" || ch.logo.trim() === "")
            .map(ch => ch.name)
        )
      );

      if (namesToLookup.length > 0) {
        console.log(`[Xtream Logo Enricher] Attempting batch logo lookup on ${namesToLookup.length} channels from GitHub cache...`);
        const logoLookupUrl = getApiUrl("api/logo-lookup-batch");
        const logoResp = await fetch(logoLookupUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ names: namesToLookup })
        });
        
        if (logoResp.ok) {
          const logoData = await logoResp.json();
          if (logoData && logoData.logos) {
            let enrichedCount = 0;
            mapped.forEach(ch => {
              const matchedLogo = logoData.logos[ch.name];
              if ((!ch.logo || ch.logo.includes("placeholder") || ch.logo === "") && matchedLogo) {
                ch.logo = matchedLogo;
                enrichedCount++;
              }
            });
            console.log(`[Xtream Logo Enricher] Successfully enriched ${enrichedCount} channels with high-quality logos from GitHub.`);
          }
        }
      }
    } catch (logoErr) {
      console.warn("[Xtream Logo Enricher] Batch logo lookup failed:", logoErr);
    }

    return mapped;
  } catch (err) {
    console.error("Failed loading Xtream streams:", err);
    throw err;
  }
}

// Retrieve program on-demand (short EPG)
export async function fetchXtreamShortEpg(streamId: number): Promise<{ current: EpgProgramme | null; next: EpgProgramme | null }> {
  const { server, username, password, useCorsProxy } = getSavedXtreamCredentials();
  if (!server || !username || !password) return { current: null, next: null };
  
  try {
    const rawUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_short_epg&stream_id=${streamId}`;
    const targetUrl = buildUrl(rawUrl, useCorsProxy);
    
    const response = await fetch(targetUrl);
    if (!response.ok) return { current: null, next: null };
    
    const data = await response.json();
    if (data && Array.isArray(data.epg_listings)) {
      const listings = data.epg_listings;
      if (listings.length === 0) return { current: null, next: null };
      
      // Map listing elements to our local EpgProgramme interface
      // Xtream Codes responds with listings that usually have:
      // title (base64 encoded sometimes? No, raw string mostly), start_timestamp, stop_timestamp, description
      const nowTs = Math.floor(Date.now() / 1000);
      
      let currentItem: any = null;
      let nextItem: any = null;
      
      // Find current active item
      for (let i = 0; i < listings.length; i++) {
        const item = listings[i];
        const start = Number(item.start_timestamp);
        const stop = Number(item.stop_timestamp);
        
        if (nowTs >= start && nowTs <= stop) {
          currentItem = item;
          if (i + 1 < listings.length) {
            nextItem = listings[i + 1];
          }
          break;
        }
      }
      
      // If we couldn't find a precisely matched item, pick the first one as current
      if (!currentItem && listings.length > 0) {
        currentItem = listings[0];
        if (listings.length > 1) {
          nextItem = listings[1];
        }
      }
      
      const currentProg: EpgProgramme | null = currentItem ? {
        start: new Date(Number(currentItem.start_timestamp) * 1000).toISOString(),
        stop: new Date(Number(currentItem.stop_timestamp) * 1000).toISOString(),
        title: currentItem.title ? decodeURIComponent(escape(window.atob(currentItem.title))) : "Programme en direct", 
        // Note: some servers base64-encode titles, others send raw strings. Handle both!
        desc: currentItem.description ? getDecodedString(currentItem.description) : "Aucune description.",
        category: "Divertissement"
      } : null;

      // Robust base64 handler if the server returns base64
      if (currentProg && currentItem.title) {
        // Simple test to see if it was base64
        if (isBase64(currentItem.title)) {
          try { currentProg.title = atob(currentItem.title); } catch (_) {}
        } else {
          currentProg.title = currentItem.title;
        }
        
        if (currentItem.description) {
          if (isBase64(currentItem.description)) {
            try { currentProg.desc = atob(currentItem.description); } catch (_) {}
          } else {
            currentProg.desc = currentItem.description;
          }
        }
      }

      const nextProg: EpgProgramme | null = nextItem ? {
        start: new Date(Number(nextItem.start_timestamp) * 1000).toISOString(),
        stop: new Date(Number(nextItem.stop_timestamp) * 1000).toISOString(),
        title: nextItem.title,
        desc: nextItem.description ? nextItem.description : "",
        category: "Divertissement"
      } : null;

      if (nextProg && nextItem.title) {
        if (isBase64(nextItem.title)) {
          try { nextProg.title = atob(nextItem.title); } catch (_) {}
        } else {
          nextProg.title = nextItem.title;
        }
        if (nextItem.description) {
          if (isBase64(nextItem.description)) {
            try { nextProg.desc = atob(nextItem.description); } catch (_) {}
          } else {
            nextProg.desc = nextItem.description;
          }
        }
      }

      return { current: currentProg, next: nextProg };
    }
  } catch (err) {
    console.warn("Could not parse Xtream EPG list:", err);
  }
  return { current: null, next: null };
}

// General helpers
function isBase64(str: string): boolean {
  if (!str) return false;
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

function getDecodedString(str: string): string {
  try {
    return decodeURIComponent(escape(window.atob(str)));
  } catch (_) {
    return str;
  }
}
