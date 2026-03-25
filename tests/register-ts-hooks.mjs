import { existsSync } from "node:fs";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !specifier.match(/\.[a-z0-9]+$/i)) {
      const parentUrl = new URL(context.parentURL);

      for (const suffix of [".ts", ".js", ".json"]) {
        const candidateUrl = new URL(`${specifier}${suffix}`, parentUrl);
        if (existsSync(candidateUrl)) {
          return nextResolve(candidateUrl.href, context);
        }
      }
    }

    return nextResolve(specifier, context);
  },
});
