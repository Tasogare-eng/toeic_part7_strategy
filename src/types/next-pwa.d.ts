declare module "next-pwa" {
  import type { NextConfig } from "next"

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    sw?: string
    scope?: string
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    customWorkerDir?: string
    customWorkerSrc?: string
    customWorkerDest?: string
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    cacheStartUrl?: boolean
    dynamicStartUrl?: boolean
    dynamicStartUrlRedirect?: string
    buildExcludes?: (string | RegExp)[]
    publicExcludes?: string[]
    additionalManifestEntries?: Array<{ url: string; revision: string | null }>
    runtimeCaching?: Array<{
      urlPattern: RegExp | string
      handler: string
      options?: Record<string, unknown>
    }>
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig

  export default withPWA
}
