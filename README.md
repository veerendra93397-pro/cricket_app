# BTG Cricket

A tournament, match, and live cricket scoring application built with React, TypeScript, Vite, and Tailwind CSS, ported from the original Flutter application while preserving all business logic, design tokens, scoring engine, and data structures.

## Features

- **Live Ball-by-Ball Scoring Engine**:
  - Full match controls for dots (0), runs (1, 2, 3, 4, 6), extras (Wide, No Ball, Bye, Leg Bye), and wickets.
  - Automatic strike rotation on odd runs and over completions.
  - Automatic prompts for next batsman on wicket dismissal.
  - Bowler changes and over management.
  - Multi-level undo stack for seamless ball reversal.
  - Innings break calculations with target determination and opening pair selection for 2nd innings.
  - Match completion detection (target chased or defended) with automatic tournament points table updates and NRR recalculation.

- **Match Center & Fan View**:
  - 5-tab live spectator experience: **INFO**, **LIVE**, **SCORECARD**, **COMMENTARY**, **HIGHLIGHTS**.
  - Dynamic run rate (CRR) and required run rate (RRR) computations.
  - Ball-by-ball commentary generation.
  - Full batting (Runs, Balls, 4s, 6s, SR, dismissal detail) and bowling analysis (Overs, Maidens, Runs, Wickets, Economy).

- **Tournament & League Management**:
  - Round-robin fixture generator with custom overs per match.
  - Standings & Points Table with Net Run Rate (NRR) and playoff qualification tracking.
  - Orange Cap (Most Runs) and Purple Cap (Most Wickets) leaderboards.

- **Franchise & Player Management**:
  - Franchise team roster management with captains and player counts.
  - Player profiles with career statistics (Runs, Wickets, High Score, Overs Bowled).
  - Role tracking (Batsman, Bowler, All-Rounder, Wicket-Keeper).

- **Authentication & Roles**:
  - Admin access (`admin@gmail.com`) for live scoring, match setups, and tournament creation.
  - Player/Fan mode for profile maintenance, viewing live scores, fixtures, and scorecards.
  - Quick 1-click test switchers between Admin and Player roles.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + CricTheme tokens
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Data & Auth**: Firebase / Firestore integration with offline in-memory fallback
