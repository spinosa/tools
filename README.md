# Tools

A collection of standalone web-based tools and utilities. Each tool is designed to be simple, self-contained, and runnable directly in a browser without complex build processes.

## Quick Start

All tools can be run via GitHub Gist Preview. Simply navigate to:

```
https://gistpreview.github.io/?[github-raw-url-to-index.html]
```

See each tool's README for specific instructions.

## Available Tools

| Tool | Description | Link |
|------|-------------|------|
| [QR Scanner](./qr-scanner/) | Scan QR codes and barcodes using your device camera | [README](./qr-scanner/README.md) |

## Design Philosophy

- **Simple**: No complex build systems or frameworks
- **Standalone**: Each tool works independently
- **Browser-First**: Direct browser execution, no server required
- **Mobile-Friendly**: Responsive design, touch-optimized
- **CDN Dependencies**: External libraries loaded via CDN for simplicity

## Contributing

Each tool should:
1. Live in its own directory
2. Have an `index.html` as the main entry point
3. Include a `README.md` with usage instructions
4. Work via GitHub Gist Preview
5. Be self-contained with minimal dependencies

## License

MIT
