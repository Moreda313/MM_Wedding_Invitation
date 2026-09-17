/** Resolve local media against the deployment path; preserve external URLs. */
export function assetUrl(path: string): string {
  if (!path || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
