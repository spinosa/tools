# Tools

A collection of standalone web-based tools and utilities. Each tool is designed to be simple, self-contained, and runnable directly in a browser without complex build processes.

## Available Tools

| Tool | Description | Run |
|------|-------------|-----|
| **[QR Scanner](./qr-scanner/)** | Scan QR codes and barcodes using your device camera | [Open Tool](https://raw.githack.com/spinosa/tools/claude/setup-qr-scanner-uJdqa/qr-scanner/index.html) |

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
4. Be self-contained with minimal dependencies

### Testing from a branch

Tools can be tested before merging by using `raw.githack.com` with your branch name:

```
https://raw.githack.com/spinosa/tools/YOUR-BRANCH-NAME/tool-name/index.html
```

After merging, update README links to use `main` instead of the branch name.

## License

MIT
