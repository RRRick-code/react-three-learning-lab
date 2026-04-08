const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

function normalizeBasePath(pathname: string) {
  if (!pathname) {
    return "/";
  }

  const withoutTrailingSlash = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;

  return withoutTrailingSlash || "/";
}

export function withBasePath(pathname: string) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedBasePath === "/") {
    return normalizedPathname;
  }

  return `${normalizedBasePath}${normalizedPathname}`;
}

export function stripBasePath(pathname: string) {
  const normalizedPathname = normalizeBasePath(pathname);
  const normalizedBasePath = normalizeBasePath(basePath);

  if (
    normalizedBasePath !== "/" &&
    (normalizedPathname === normalizedBasePath ||
      normalizedPathname.startsWith(`${normalizedBasePath}/`))
  ) {
    const stripped = normalizedPathname.slice(normalizedBasePath.length);

    return stripped || "/";
  }

  return normalizedPathname;
}

export function getEffectSlug(pathname: string) {
  const normalizedPathname = stripBasePath(pathname);
  const match = normalizedPathname.match(/^\/effects\/([^/]+)\/?$/);

  return match?.[1] ?? null;
}
