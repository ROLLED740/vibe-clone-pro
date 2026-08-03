import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This project may sit inside a larger workspace; pin the root so Turbopack
  // doesn't infer a parent directory's lockfile as the workspace root.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
