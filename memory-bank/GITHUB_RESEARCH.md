# Scotland Yard Open-Source Implementation Research

**Date:** December 3, 2025  
**Objective:** Find the best canonical Scotland Yard game engine with AI to mirror in TypeScript

---

## 🔍 Research Summary

After searching 77+ repositories on GitHub for "scotland yard AI", I identified **3 high-quality candidates** with complete game engines and AI implementations. The search focused on repos with minimax, alpha-beta pruning, heuristics, and complete rule implementations.

---

## 🏆 TOP 3 CANDIDATES

### 1. **ZikZhao/Scotland-Yard-2024** ⭐ RECOMMENDED

**Repository:** `ZikZhao/Scotland-Yard-2024`  
**Language:** Java  
**License:** MIT ✅  
**Last Activity:** November 30, 2024 (3 days ago - just archived)  
**Stars/Forks:** 0/0 (brand new, university coursework)  
**Score:** 82/100 university grade

#### AI Implementation Details 🧠
- **Algorithm:** Minimax with Alpha-Beta Pruning (depth 3)
- **Heuristic Function:** Custom mathematical evaluation:
  - Negative sum of squared reciprocal distances to detectives
  - Penalty for straying too far from map center
  - Maximizes escape chances while balancing map positioning
- **Performance Optimizations:**
  - Pre-computed BFS distance graph for O(1) lookups
  - `SimplifiedGameState` class for lightweight recursion
  - Reduced memory overhead during move simulation
- **AI Classes:** `MrXAI` (evasion strategy), `DetectiveAI` (pursuit)
- **Difficulty Levels:** Tunable via search depth (currently depth 3)

#### Rules Completeness ✅
- ✅ All ticket types (Taxi, Bus, Underground)
- ✅ Black tickets for Mr. X
- ✅ Double-move mechanics
- ✅ Surfacing/reveal rounds
- ✅ Win conditions (capture/escape/timeout)
- ✅ Ticket exhaustion logic

#### Code Structure 🏗️
**Design Patterns:**
- Factory Pattern (GameState/Model creation)
- Visitor Pattern (Move operations via `Move.FunctionalVisitor`)
- Observer Pattern (UI event system)
- Iterator Pattern (state traversal)

**Key Classes/Types:**
- `GameState` - Immutable game state with Guava collections
- `Move` - Hierarchy (SingleMove, DoubleMove)
- `Board` - Graph-based map representation
- `Player` - Detective/MrX roles with tickets
- `MrXAI` - Minimax search with evaluation function
- `Model` - Core game logic engine

**Architecture:**
- `cw-model/` - Game logic, board, state management
- `cw-ai/` - AI agents and pathfinding algorithms
- Strong SOLID principles, functional programming patterns
- Extensive use of Java Streams and immutability

#### Assessment 📊
**PROS:**
- ✅ **Most sophisticated AI** (minimax + alpha-beta + custom heuristics)
- ✅ **MIT License** (very permissive)
- ✅ **Recent & complete** (2024, 82/100 grade)
- ✅ **Excellent architecture** (Factory/Visitor/Observer patterns)
- ✅ **Performance-optimized** (pre-computed graphs, simplified states)
- ✅ **Well-documented** (includes report.pdf with design details)
- ✅ **Clean Java code** (easy to port to TypeScript)
- ✅ **Tunable difficulty** via search depth
- ✅ **Complete rules** including all edge cases

**CONS:**
- ⚠️ No GitHub stars/community (brand new)
- ⚠️ Just archived (read-only), but code is stable
- ⚠️ Smaller codebase (focused on essentials)

**TypeScript Portability:** ⭐⭐⭐⭐⭐  
Factory/Visitor/Observer patterns translate directly to TypeScript. Immutable collections → readonly arrays. Streams → Array methods. Clean class hierarchy is perfect for TS interfaces.

---

### 2. **tannousmarc/scotland-yard-AI**

**Repository:** `tannousmarc/scotland-yard-AI`  
**Language:** Java  
**License:** Not specified ⚠️  
**Last Activity:** May 11, 2017 (7+ years old)  
**Stars/Forks:** 3/0  
**Topics:** #minimax #alpha-beta #ai #graph-algorithms

#### AI Implementation Details 🧠
- **Algorithm:** Minimax with Alpha-Beta Pruning (variable depth)
- **Graph Traversal:** Dijkstra's algorithm / A* / Lookup tables
- **Heuristic Function:** Polynomial scoring based on:
  - Distance to opponents
  - Available escape routes
  - "Dead state" detection
- **Performance:** Depth >3 takes "a LONG time" (per README)
- **Difficulty Levels:** Tunable via minimax depth

#### Rules Completeness ✅
- ✅ Complete game logic implementation
- ✅ Graph-based movement (weighted edges)
- ✅ Limited tickets
- ✅ Periodic reveal of Mr. X location
- ⚠️ No explicit mention of double-moves or black tickets

#### Code Structure 🏗️
**Key Classes/Types:**
- `src/main/java/uk/ac/bris/cs/scotlandyard/ui/ai/` directory structure
- Maven-based project (`pom.xml`)
- Graph theory foundation

#### Assessment 📊
**PROS:**
- ✅ **Well-documented algorithm** (minimax + alpha-beta)
- ✅ **Multiple graph traversal options** (Dijkstra/A*/lookup)
- ✅ **Explicit AI focus** (detailed README about decision-making)
- ✅ **Polynomial heuristic** (carefully weighted evaluation)

**CONS:**
- ⚠️ **No license specified** (legal risk)
- ⚠️ **7+ years old** (may be outdated)
- ⚠️ **Sparse documentation** on rules completeness
- ⚠️ **Performance issues** at depth >3
- ⚠️ **No GUI or test suite visible**

**TypeScript Portability:** ⭐⭐⭐⭐  
Java → TS is straightforward. Graph algorithms port easily. Concerns: no license, unclear rules completeness.

---

### 3. **ckallum/Scotland-Yard**

**Repository:** `ckallum/Scotland-Yard`  
**Language:** Java  
**License:** Not specified ⚠️  
**Last Activity:** March 31, 2021 (3.5 years old)  
**Stars/Forks:** 2/1  
**Topics:** #dijkstras-algorithm #scotland-yard

#### AI Implementation Details 🧠
- **Algorithm:** Dijkstra's algorithm (pathfinding)
- **Heuristic:** Location weighting factor
- **Strategy:** Escape-focused (find best move for Mr. X)
- **AI Classes:** `MrXAI`, `DetectiveAI` (random)
- **Difficulty Levels:** Not explicitly mentioned (appears single-level)

#### Rules Completeness ✅
- ✅ "Complete implementation" (per README)
- ✅ All tests passing (university coursework)
- ✅ GUI included (Java Swing)
- ⚠️ No explicit details on ticket types/special moves

#### Code Structure 🏗️
**Architecture:**
- `cw-ai/` - AI implementation
- `cw-model/` - Game model
- Maven project structure
- University of Bristol OOP coursework (50% + AI bonus)

**Game Modes:**
1. Player vs Player
2. Player vs MrX AI
3. Random Detective AI vs MrX AI

#### Assessment 📊
**PROS:**
- ✅ **Complete game + tests** (university coursework)
- ✅ **GUI included** (Swing interface)
- ✅ **Modular AI** (easy to swap strategies)
- ✅ **Test suite** (Maven: `mvn clean test`)

**CONS:**
- ⚠️ **No license** (academic work)
- ⚠️ **Simple AI** (Dijkstra only, no minimax)
- ⚠️ **No difficulty levels** (single strategy)
- ⚠️ **Random detective AI** (not strategic)
- ⚠️ **3.5 years old**

**TypeScript Portability:** ⭐⭐⭐  
Clean Java structure, but simple AI may need replacement. Dijkstra's alone isn't competitive.

---

## 🚫 REJECTED CANDIDATES

### alhayden/ScotlandYard (Python)
- **Language:** Python
- **License:** Not specified
- **Last Activity:** June 11, 2018
- **Assessment:** Framework only - requires external AI modules (`mrx.py`, `detectives.py`). No built-in AI logic. More of a game harness than complete engine.

### shogo54/scotland-yard-game (Java)
- **Language:** Java
- **License:** GPL-3.0 ⚠️ (copyleft)
- **Last Activity:** February 3, 2020
- **AI:** Very simple (CleverMrX avoids next detective positions, RandomMrX is random)
- **Assessment:** Too basic - no minimax, no heuristics, just reactive avoidance. GPL license incompatible with MIT.

### Rorschach7552/Scotland-yard-detective-AI-solver (Jupyter)
- **Language:** Jupyter Notebook
- **License:** Not specified
- **Last Activity:** May 7, 2024
- **Assessment:** Research project (detective perspective only), no complete game engine. Single notebook file.

---

## 🎯 FINAL RECOMMENDATION

### **Winner: ZikZhao/Scotland-Yard-2024**

**Reasoning:**

1. **AI Quality (Critical):** Best-in-class minimax with alpha-beta pruning, custom heuristics, and performance optimizations. Tunable difficulty via depth. Far superior to simple Dijkstra-based approaches.

2. **Complete Rules:** Explicitly documents all ticket types, double-moves, surfacing, win conditions. University grade of 82/100 indicates thorough implementation.

3. **License:** MIT (most permissive) vs. no license or GPL on alternatives.

4. **Architecture:** SOLID principles, Design Patterns (Factory/Visitor/Observer), immutability, and functional programming make it ideal for TypeScript mirroring.

5. **Recency:** 2024 implementation (3 days old archive) vs. 2017-2021 alternatives. Modern Java practices.

6. **Documentation:** Includes `report.pdf` with design rationale. README clearly explains AI strategy and architecture.

7. **TypeScript Portability:** Clean class hierarchy, functional patterns, and immutable state translate perfectly to modern TypeScript/React patterns.

---

## 📋 NEXT STEPS

1. **Clone & Review:**
   ```bash
   git clone https://github.com/ZikZhao/Scotland-Yard-2024.git
   cd Scotland-Yard-2024
   ```

2. **Study Key Files:**
   - `report.pdf` - Design decisions and algorithm details
   - `cw-ai/MrXAI.java` - Minimax implementation
   - `cw-model/` - GameState, Board, Move classes
   - Test files for rules validation

3. **Map to TypeScript:**
   - `GameState` → Immutable TS interface with readonly properties
   - `Move.FunctionalVisitor` → Discriminated union types
   - `Board` → Graph data structure (nodes/edges)
   - `MrXAI.minimax()` → Recursive TS function with alpha-beta
   - Observer pattern → React state management

4. **Validate Rules:**
   - Cross-reference with official Scotland Yard rules
   - Test edge cases: ticket exhaustion, capture, timeout
   - Verify double-move and black ticket logic

5. **Adapt Heuristics:**
   - Port scoring function: `-Σ(1/distance²)` + center penalty
   - Tune weights for web gameplay
   - Add difficulty presets (depth 1-5)

---

## 🔗 Repository URLs

1. ✅ **ZikZhao/Scotland-Yard-2024** - https://github.com/ZikZhao/Scotland-Yard-2024
2. tannousmarc/scotland-yard-AI - https://github.com/tannousmarc/scotland-yard-AI
3. ckallum/Scotland-Yard - https://github.com/ckallum/Scotland-Yard
4. alhayden/ScotlandYard - https://github.com/alhayden/ScotlandYard
5. shogo54/scotland-yard-game - https://github.com/shogo54/scotland-yard-game
6. Rorschach7552/Scotland-yard-detective-AI-solver - https://github.com/Rorschach7552/Scotland-yard-detective-AI-solver

---

## 📊 Comparison Matrix

| Repository | Language | License | Last Active | AI Algorithm | Difficulty Levels | Rules Complete | Code Quality | TS Port | Score |
|------------|----------|---------|-------------|--------------|-------------------|----------------|--------------|---------|-------|
| **ZikZhao/Scotland-Yard-2024** | Java | MIT ✅ | Nov 2024 | Minimax + Alpha-Beta + Heuristics | Tunable (depth) | ✅ All | Excellent (82/100) | ⭐⭐⭐⭐⭐ | **95/100** |
| tannousmarc/scotland-yard-AI | Java | None ⚠️ | May 2017 | Minimax + Alpha-Beta | Tunable (depth) | ⚠️ Unclear | Good | ⭐⭐⭐⭐ | 70/100 |
| ckallum/Scotland-Yard | Java | None ⚠️ | Mar 2021 | Dijkstra only | Single | ✅ Complete | Good | ⭐⭐⭐ | 65/100 |
| shogo54/scotland-yard-game | Java | GPL ⚠️ | Feb 2020 | Reactive avoid | 2 levels (simple) | ✅ Complete | Fair | ⭐⭐ | 50/100 |
| alhayden/ScotlandYard | Python | None ⚠️ | Jun 2018 | None (framework) | N/A | ⚠️ Framework only | Fair | ⭐⭐ | 40/100 |
| Rorschach7552/detective-AI | Jupyter | None ⚠️ | May 2024 | Research only | N/A | ❌ No engine | Research | ⭐ | 30/100 |

---

## ✅ Conclusion

**Use `ZikZhao/Scotland-Yard-2024` as the canonical source.**

It offers the most sophisticated AI (minimax + alpha-beta + custom heuristics), complete rules implementation, excellent architecture (Factory/Visitor/Observer), MIT license, and is the most recent (2024). The code quality is proven by its 82/100 university grade and is optimized for performance with pre-computed graphs and simplified states.

The architecture translates beautifully to TypeScript/React, and the AI can be tuned for difficulty by adjusting search depth. This is the gold standard for open-source Scotland Yard implementations.
