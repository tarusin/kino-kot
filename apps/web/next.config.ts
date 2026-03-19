import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    const rules = config.module?.rules as Array<any>;
    if (rules) {
      for (const rule of rules) {
        if (!rule?.oneOf) continue;
        for (const oneOf of rule.oneOf) {
          if (!Array.isArray(oneOf?.use)) continue;

          // Skip font-related loaders (they have next-font-loader)
          const hasNextFontLoader = oneOf.use.some(
            (l: any) =>
              typeof l?.loader === "string" &&
              l.loader.includes("next-font")
          );
          if (hasNextFontLoader) continue;

          for (const loader of oneOf.use) {
            if (
              typeof loader === "object" &&
              typeof loader?.loader === "string" &&
              loader.loader.includes("css-loader") &&
              loader.options?.modules &&
              typeof loader.options.modules.getLocalIdent === "function"
            ) {
              const origGetLocalIdent = loader.options.modules.getLocalIdent;
              loader.options.modules.getLocalIdent = (
                context: any,
                localIdentName: string,
                localName: string,
                options: any
              ) => {
                if (context.resourcePath.includes(".module.")) {
                  return localName;
                }
                return origGetLocalIdent(context, localIdentName, localName, options);
              };
            }
          }
        }
      }
    }
    return config;
  },
};

export default nextConfig;
