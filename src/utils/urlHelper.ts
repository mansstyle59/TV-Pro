export const getAppBaseUrl = (): string => {
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
