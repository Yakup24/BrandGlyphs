# BrandGlyphs

This fork is based on `elax46/custom-brand-icons` and keeps the original icon
prefix `phu:` for Home Assistant compatibility.

## Fork Goals

- keep the icon pack easy to install in Home Assistant
- make builds deterministic and fail-fast
- validate icon filenames, SVG roots, path data, and generated dist output
- keep the generated `dist/custom-brand-icons.js` compatible with existing
  dashboards
- make project metadata clearly identify this fork as BrandGlyphs

## Compatibility

The generated JavaScript filename and Home Assistant icon prefix intentionally
remain unchanged:

- file: `dist/custom-brand-icons.js`
- prefix: `phu:`

Changing those would break existing Home Assistant configurations.

## Test

```sh
npm test
```

This runs project validation and rebuilds the distributable icon bundle.
