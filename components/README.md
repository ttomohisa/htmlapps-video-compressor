# Reusable UI components

This directory mirrors reusable patterns from `htmlapps-template`.

- `confirm-dialog.html`: a standalone reference implementation for an accessible confirmation dialog. On narrow screens it becomes a bottom sheet with large touch targets.

The production video-compressor UI keeps its confirmation markup in `src/index.template.html`, but follows the same mobile behavior so the generated app stays a single HTML file.
