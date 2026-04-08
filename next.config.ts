import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const projectBasePath = repositoryName ? `/${repositoryName}` : "";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? projectBasePath;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["three"],
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
