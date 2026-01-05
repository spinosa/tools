# Agents Configuration

## Context

This repository (`tools`) is a collection of standalone web-based tools and utilities. Each tool is designed to be simple, self-contained, and runnable directly in a browser without complex build processes.

## Repository Architecture

```
tools/
├── CLAUDE.md          # Points to this file
├── agents.md          # This file - agent configuration
├── README.md          # Repository overview and tool index
└── [tool-name]/       # Each tool in its own directory
    ├── index.html     # Main entry point
    └── README.md      # Tool-specific documentation
```

## Development Guidelines

### Tool Requirements
- **Standalone**: Each tool should work independently
- **No Build Step**: Tools should run directly in the browser
- **CDN Dependencies**: Use CDN-hosted libraries (unpkg, cdnjs, jsdelivr)
- **GitHub Gist Preview Compatible**: Tools should work when served via `https://gistpreview.github.io/`

### Technology Stack
- **HTML5**: Semantic, accessible markup
- **CSS3**: Modern styling, responsive design
- **JavaScript**: Vanilla JS preferred, Alpine.js for reactivity when needed
- **Libraries**: Minimal external dependencies, loaded via CDN

### Code Style
- Use modern ES6+ JavaScript features
- Keep code readable and well-commented
- Mobile-first responsive design
- Handle errors gracefully with user feedback

## Available Tools

| Tool | Description | Status |
|------|-------------|--------|
| qr-scanner | QR code and barcode scanner using device camera | Active |

## Agent Behavior

When working on this repository:
1. Maintain simplicity - avoid over-engineering
2. Test that tools work in browser environment
3. Document each tool thoroughly in its README
4. Keep dependencies minimal and CDN-based
5. Ensure mobile compatibility for camera/sensor-based tools
