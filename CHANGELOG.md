# Changelog

## [0.1.2] - 2026-03-18

### Fixed

- **`no-inline-color-styles`**: `LogicalExpression` values (e.g. `borderColor={isError && "#ff0000"}`) were not checked — both sides of `&&` and `||` are now inspected.
- **`no-palette-colors`**: Tailwind v4 arbitrary opacity bracket syntax (`text-red-500/[0.5]`, `bg-blue-200/[33%]`) was not matched by the palette regex.
- **`no-palette-colors`**: String concatenation with `+` (e.g. `"flex " + (cond ? "bg-red-500" : "bg-gray-100")`) was not traversed — `BinaryExpression` nodes are now walked.

## [0.1.1] - 2026-03-18

### Fixed

- **`no-palette-colors`**: Template literal expressions (e.g. `` `${cond ? "text-green-500" : "bg-blue-500"}` ``) were not traversed — colors inside `${}` blocks are now detected.
- **`no-palette-colors`**: Tailwind v4 trailing `!` important modifier (`text-green-500!`) was not recognised. Both the v3 leading form (`!text-green-500`) and the v4 trailing form are now handled.
- **`no-inline-color-styles`**: Shorthand CSS properties (`border`, `borderTop`, `background`, `boxShadow`, `outline`, etc.) were absent from the checked property set. Compound values such as `"1px solid #e0e0e0"` are now detected and flagged.

## [0.1.0] - 2026-03-17

Initial release.
