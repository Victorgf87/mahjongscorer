# Pavilion reference screens (missing Stitch coverage)

Static HTML mocks for flows that did not have a dedicated Stitch screen. Open any file in a browser (double-click or `open tmp/pavilion-missing-screens/communities-index.html` on macOS).

- `communities-index.html` — community grid
- `community-show.html` — community header + events + leagues
- `games-index.html` — recent games + filters + table
- `tournament-bracket.html` — simplified bracket / final node

These are **not** part of the Rails asset pipeline; they are design references only.

To retry **Stitch** generation for the same project, use the Stitch UI or MCP when the service responds (previous MCP requests timed out).
