import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["bin/shugo.ts", "src/daemon.ts"],
  format: ["esm"],
  dts: true,
  outDir: "dist",
  clean: true,
  sourcemap: false,
  minify: false,
  splitting: false,
  external: ["typescript"],
  loader: {
    ".tsx": "tsx",
    ".ts": "ts",
  },
});
