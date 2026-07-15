# Shiten Plugins

Plugins extend Shiten without modifying core code. They hook into specific points in the pipeline to add custom behavior.

## Structure

```
shiten-plugins/
  my-plugin/
    plugin.ts      # Plugin implementation
    package.json   # (optional) Plugin metadata
```

## Plugin API

A plugin exports an object with:

```typescript
export default {
  name: string,           // Unique plugin name
  version: string,        // Semver version
  description: string,    // What the plugin does
  hooks?: {               // Hook implementations
    "pre-analysis"?: (context) => context,
    "post-analysis"?: (context) => context,
    "custom-check"?: (context) => string | null,
    "custom-recommendation"?: (shitenDir) => Recommendation | null,
    "custom-metric"?: (context) => Metric | null,
  }
};
```

## Available Hooks

| Hook | When | Input | Output |
|------|------|-------|--------|
| `pre-analysis` | Before each pipeline stage | PipelineContext | PipelineContext |
| `post-analysis` | After each pipeline stage | PipelineContext | PipelineContext |
| `custom-check` | During `shiten audit` | {projectRoot, shitenDir, healthReport} | string \| null |
| `custom-recommendation` | During `shiten evolve` | shitenDir | Recommendation \| null |
| `custom-metric` | During `shiten audit` | context | Metric \| null |

## Creating a Plugin

1. Create a directory: `shiten-plugins/my-plugin/`
2. Create `plugin.ts`:
   ```typescript
   export default {
     name: "my-plugin",
     version: "1.0.0",
     description: "My custom check",
     hooks: {
       "custom-check": async (ctx) => {
         // Your check logic
         return "Issue found"; // or null
       }
     }
   };
   ```
3. Run `shiten audit` — your plugin will be loaded automatically

## Plugin Discovery

Shiten loads plugins from two locations:
1. **Project-level**: `{projectRoot}/shiten-plugins/`
2. **Global**: `~/.config/shiten/plugins/`

Plugins are loaded by dynamic import, so they can be TypeScript or JavaScript.

## Error Handling

Plugin errors are caught and logged but don't break the pipeline. If a plugin throws, it's silently skipped.
