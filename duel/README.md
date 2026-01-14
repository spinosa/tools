# The Duel - 1776

A two-player local multiplayer dueling game set in the American Revolutionary War era. Share a keyboard with a friend and settle your differences like gentlemen of the Continental Congress.

## Quick Start

**[Play The Duel](https://raw.githack.com/spinosa/tools/claude/duel-game-p39Qu/duel/index.html)** - works on any device with a keyboard.

## Features

- **F1-style countdown** - Variable timing lights prevent perfect anticipation
- **Two-player local multiplayer** - Share a keyboard, face off side by side
- **Honor system** - Showing mercy has consequences, good and bad
- **Rank progression** - Rise from Scoundrel to Founding Father
- **Win streaks** - 3 consecutive wins earn a promotion
- **Persistent progress** - Scores and ranks saved to localStorage
- **SVG graphics** - Colonial-era duelists rendered entirely in code

## How to Play

### Controls

| Player | Fire | Reconsider (Show Mercy) |
|--------|------|-------------------------|
| **Left (Federalist)** | Q | A |
| **Right (Republican)** | L | P |

### The Duel

1. **Press "Begin Duel"** to start the countdown
2. **Watch the lights** - Red lights illuminate in pairs (timing varies!)
3. **Wait for green** - When both green lights appear, FIRE!
4. **First accurate shot wins** - But shoot early and your shot goes wide

### Special Rules

| Situation | Outcome |
|-----------|---------|
| **Shoot first after green** | You win! +100 points |
| **Shoot before green** | Your shot misses - you cannot win this round |
| **Both shoot early** | Draw - neither wins |
| **Reconsider while opponent shoots** | They win, but lose a rank (dishonorable!) |
| **Both reconsider** | Honor prevails! Both gain a rank |
| **Win 3 in a row** | Gain a rank |

### Ranks

Progress through the ranks of colonial society:

| Level | Rank | Stars |
|-------|------|-------|
| 0 | Scoundrel | (none) |
| 1 | Gentleman | ★ |
| 2 | Esquire | ★★ |
| 3 | Captain | ★★★ |
| 4 | Colonel | ★★★★ |
| 5 | General | ★★★★★ |
| 6 | Founding Father | ★★★★★★ |

## Architecture

### File Structure

```
duel/
├── index.html    # Single-file app (HTML + CSS + JS)
└── README.md     # This file
```

### Technology Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling, animations, gradients |
| **Vanilla JavaScript** | Game logic, state management |
| **SVG** | All character and pistol graphics |
| **localStorage** | Progress persistence |

### No External Dependencies

This game runs entirely standalone with zero CDN dependencies. All graphics are inline SVG, all logic is vanilla JavaScript.

### Key Components

#### 1. Countdown System
- F1-style light sequence (3 rows of red, then green)
- Random timing variance between lights (800-1200ms)
- Additional random delay before green (1-3 seconds)
- Prevents players from timing their shots perfectly

#### 2. Input Handling
- Records first action only (can't change your mind)
- Tracks exact timestamp of each action
- Distinguishes between pre-green and post-green actions

#### 3. Result Resolution
- Compares action types (shoot vs reconsider vs nothing)
- Compares timestamps for simultaneous shots
- Applies honor/dishonor level changes

#### 4. Visual Feedback
- Pistol recoil animation on firing
- Smoke effect from barrel
- Pistol raise animation for reconsider
- Pulsing winner message

## Game Strategy

- **Safe play**: Wait clearly for green, then fire - reliable but slower
- **Risky play**: Anticipate the green - faster but might miss
- **Mind games**: Threaten to reconsider, make them hesitate
- **Honor farming**: Coordinate mutual reconsiders to rank up (but that's no fun!)

## Browser Compatibility

Works in all modern browsers:
- Chrome, Firefox, Safari, Edge
- Desktop or laptop with keyboard required
- No mobile support (needs two-player keyboard input)

## Privacy

- All game logic runs locally in your browser
- No data is sent to any server
- Progress stored only in browser localStorage
- Clear with the "Reset All" button

## License

MIT
