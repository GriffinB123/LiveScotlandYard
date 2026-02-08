# Decision Log

| Date | Decision | Rationale |
|------|----------|-----------||
| 2025-12-03 | **Web prototype first, then Swift port** | Validate game mechanics, AI, and UX patterns faster in TS/React before committing to native development. Web prototype can be playtested immediately without TestFlight. |
| 2025-12-03 | **Multi-window browser simulation (TV + controllers)** | More faithful to final iOS/tvOS experience than single-screen hot-seat. Tests sync/networking patterns early. Runs on single machine for dev simplicity. |
| 2025-12-03 | **BroadcastChannel for web prototype sync** | Browser-native, no backend needed, perfect for single-machine multi-window. Simple protocol that maps cleanly to MultipeerConnectivity later. |
| 2025-12-03 | **Mirror existing open-source rules + AI engine** | Don't reinvent the wheel. Leverage battle-tested logic and AI strategies. Easier to port well-structured existing code than design from scratch. |
| 2025-12-03 | **Prioritize engines with built-in AI logic** | AI is a key differentiator (3 difficulty tiers in PRD). Porting existing AI strategies is faster and more reliable than designing new ones. |
| 2025-12-03 | **Engine-first implementation (no UI initially)** | Validate rules correctness independent of UI. Engine can be thoroughly tested with automated games. Clean separation enables Swift port. |
| 2025-12-03 | **GameEngine object/class API (not pure functions)** | OO style maps more naturally to Swift classes. Provides clear facade for UI and future ports. Easier to reason about than scattered functions. |
| 2025-12-03 | **Include black + double-move tickets in MVP** | These are core Scotland Yard mechanics, not optional add-ons. Implementing them later would require significant refactoring of move generation and visibility logic. |
| 2025-12-03 | **AI-only engine runner (no interactive human)** | No interactive human play until full GUI exists. Scripted policies stand in for humans in tests. Focuses engine work on correctness, not I/O. |
| 2025-12-03 | **Both AI self-play and scripted human modes** | Self-play enables automated testing and statistics gathering. Scripted human mode tests mixed AI/human scenarios without UI complexity. |
| 2025-12-03 | **TypeScript module runner (not Node CLI)** | TS module that imports engine matches how Swift tests will work. No I/O plumbing to throw away later. Deterministic and easy to port. |
| 2025-12-03 | **Rules-complete before visual polish** | PRD explicitly states "full rules first". Ensures mechanics are correct before investing in animations and UX refinement. Avoids rebuilding polished UI when rules change. |
