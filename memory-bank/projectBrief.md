# Project Brief

## Purpose

Create a digital couch-co-op adaptation of Ravensburger's Scotland Yard board game for in-person play, using Apple TV as the shared board and iPhones/iPads as private controllers.

The project follows a phased approach:
1. **Phase 1 (Current)**: Build a rules-complete web prototype to validate game mechanics, AI, and UX patterns
2. **Phase 2**: Port to native Swift for iOS/iPadOS and tvOS with MultipeerConnectivity

## Target Users

**Primary**: Families and friend groups playing together in-person (couch co-op)
- 2-6 players (1 Mr. X + 1-5 detectives)
- Ages 10+ (matching board game recommendations)
- Apple ecosystem users (iPhone/iPad + Apple TV)

**Secondary**: Solo players on iOS
- Single-player mode where AI controls all other roles
- Practice and skill development

## Key Goals

1. **Faithful adaptation**: Preserve core Scotland Yard mechanics and strategy
2. **Modern polish**: Leverage digital medium for better UX (hidden moves, auto-tracking, AI opponents)
3. **Accessibility**: Support various player counts and skill levels through handicaps and AI difficulty
4. **Family-friendly**: Simple setup, clear rules, appropriate challenge levels

## Success Criteria

- Rules-complete engine that accurately implements Scotland Yard mechanics
- AI that provides engaging challenge across difficulty levels
- Smooth multi-device sync (web prototype) and networking (iOS/tvOS)
- Intuitive UX that non-gamers can pick up quickly
- Performance: <100ms sync latency, <500ms AI decisions
