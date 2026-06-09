export const getAppBaseUrl = (): string => {
  // First priority: user-defined server URL in localStorage
  const savedServer = localStorage.getItem("backend_server_url");
  if (savedServer) {
    return savedServer.replace(/\/$/, "");
  }
  
  // Second priority: build-time Vite environment variable
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // Fallback: standard relative origin
  const loc = window.location;
  let path = loc.pathname;
  
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -11);
  } else if (path.endsWith(".html")) {
    path = path.substring(0, path.lastIndexOf("/"));
  }
  
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  
  const origin = loc.origin || `${loc.protocol}//${loc.host}`;
  return `${origin}${path}`;
};

export const getApiUrl = (apiPath: string): string => {
  const base = getAppBaseUrl();
  const cleanPath = apiPath.startsWith("/") ? apiPath.slice(1) : apiPath;
  return `${base}/${cleanPath}`;
};

export const isGitHubPages = (): boolean => {
  const host = window.location.hostname;
  return host.includes("github.io") || host.includes("github.com");
};

export const getAppHostUrlOnly = (): string => {
  // For static assets or links that MUST be on the frontend router
  const loc = window.location;
  let path = loc.pathname;
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -11);
  } else if (path.endsWith(".html")) {
    path = path.substring(0, path.lastIndexOf("/"));
  }
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  const origin = loc.origin || `${loc.protocol}//${loc.host}`;
  return `${origin}${path}`;
};
