# Layout audit — 2026-10-10

## Reproduced baseline

The native dialog shells already kept their controls and long content reachable. Wheel gestures over the backdrop still scrolled the underlying page.

Baseline verification used cloud Chromium at desktop 1180×757, short desktop 1180×300, and 320×252 CSS pixels at 300% browser zoom, with synthetic media and English text. Existing dialog shells were inspected to their final content before selecting the fix.

## Scoped changes

Lock document/body scrolling only while a native modal is open. Preserve the existing flex shell, scroll body, native keyboard focus, and close handlers.

The local-processing label keeps its existing truthful copy and uses the decorative shield from PDF Fill & Sign. The app brand, favicon, processing engine, formats, and dependencies are unchanged.

## Automated coverage

54 lifecycle tests on source, checked-in root, and readable build; 3 dialog/badge checks on all four representations; 19 timing-reader tests; 9 actual embedded-core/byte-parity tests; 5 brand/wrapper checks.

The checked-in HTML was reconstructed from the current template using the unchanged embedded dependencies after proving baseline source/release assembly and raw dependency hashes against the latest official Windows artifact. Local PowerShell is unavailable; exact-head Windows CI remains authoritative.

## Final verification gate

Before this PR is marked ready, confirm exact-head Windows CI and official artifact parity, then repeat native desktop/narrow/short geometry; inside/backdrop/Close/Escape/reopen; complete forward/reverse Tab cycles; outside-backdrop wheel and restored page scrolling; long input/output names; all affected dialogs/settings; and synthetic input → operation → actual saved output. The PR validation record reports completed results and any remaining limitations.

Physical mobile devices, software keyboards, rotation, Safari, Firefox, and local file:// execution are not verified by this cloud Chromium audit.
