# QR & Barcode Scanner

A simple, mobile-friendly QR code and barcode scanner that runs entirely in the browser.

## Quick Start - GitHub Gist Preview

To use this tool immediately, open this URL on your mobile device:

```
https://gistpreview.github.io/?https://github.com/[username]/tools/blob/main/qr-scanner/index.html
```

Replace `[username]` with the actual GitHub username or organization where this repository is hosted.

**Alternative:** You can also use raw.githack.com:
```
https://raw.githack.com/[username]/tools/main/qr-scanner/index.html
```

## Features

- **📷 Real-time scanning** - Camera stays on while scanning, no need to take photos
- **🔊 Audio feedback** - Distinct beep sounds for new scans vs duplicates
- **📋 Running list** - See all scanned codes while camera is active
- **🔄 Duplicate detection** - Visual and audio indication when re-scanning a code
- **💾 Persistent storage** - Codes saved to localStorage, survive page refresh
- **📱 Mobile optimized** - Touch-friendly, responsive design
- **🔗 Smart type detection** - Automatically detects URLs, emails, phone numbers, etc.

## Supported Code Types

### QR Codes
- Standard QR codes
- URLs
- Email addresses
- Phone numbers
- WiFi credentials
- vCards (contact info)
- Plain text

### Barcodes
- EAN-13, EAN-8
- UPC-A, UPC-E
- Code 128, Code 39, Code 93
- Codabar
- ITF (Interleaved 2 of 5)

## How to Use

1. **Open the app** on your mobile device using the URL above
2. **Grant camera permission** when prompted
3. **Tap "Start Scanning"** to activate the camera
4. **Point at any QR code or barcode** - the app will automatically detect and scan it
5. **Hear the beep** - a high beep for new codes, double low beep for duplicates
6. **View your list** - all scanned codes appear below the camera view
7. **Tap "Stop Scanning"** when done to review and manage your list

### Managing Scanned Codes

- **Copy**: Tap the 📋 icon to copy a code to clipboard
- **Delete**: Tap the 🗑️ icon to remove a code
- **Clear All**: Remove all scanned codes at once
- **URLs**: Tap to open in a new tab

## Architecture

### File Structure

```
qr-scanner/
├── index.html    # Single-file app (HTML + CSS + JS)
└── README.md     # This file
```

### Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **HTML5** | Structure and camera access | - |
| **CSS3** | Styling and animations | - |
| **Alpine.js** | Reactive UI state management | 3.x |
| **html5-qrcode** | QR/barcode scanning engine | 2.3.8 |
| **Web Audio API** | Beep sound generation | Native |

### External Dependencies (CDN)

All dependencies are loaded via CDN for simplicity:

```html
<!-- Alpine.js - Lightweight reactive framework -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- html5-qrcode - QR and barcode scanning library -->
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
```

### Key Components

#### 1. Scanner Engine (`html5-qrcode`)
- Uses device camera via `getUserMedia` API
- Processes video frames to detect codes
- Supports multiple barcode formats
- Provides decoded text and format information

#### 2. State Management (`Alpine.js`)
- Manages scanning state (active/inactive)
- Maintains list of scanned codes
- Handles toast notifications
- Reactive UI updates

#### 3. Audio Feedback (`Web Audio API`)
- Generates beep sounds programmatically
- No external audio files needed
- Different tones for new vs duplicate scans:
  - **New code**: Single 800Hz tone (0.15s)
  - **Duplicate**: Double 400Hz/300Hz tones (0.1s each)

#### 4. Data Persistence (`localStorage`)
- Codes saved automatically after each scan
- Data survives page refresh
- JSON serialization for complex objects

### Code Type Detection

The app automatically classifies scanned content:

```javascript
detectType(value) {
    if (/^https?:\/\//i.test(value)) return 'url';
    if (/^mailto:/i.test(value)) return 'email';
    if (/^tel:/i.test(value)) return 'phone';
    if (/^WIFI:/i.test(value)) return 'wifi';
    if (/^BEGIN:VCARD/i.test(value)) return 'contact';
    if (/^\d+$/.test(value)) return 'number';
    return 'text';
}
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome (Android) | ✅ Full support |
| Safari (iOS 14.3+) | ✅ Full support |
| Firefox (Android) | ✅ Full support |
| Samsung Internet | ✅ Full support |
| Desktop Chrome | ⚠️ Works with webcam |
| Desktop Safari | ⚠️ Works with webcam |

**Note**: Camera access requires HTTPS or localhost.

## Privacy

- All processing happens locally in your browser
- No data is sent to any server
- Scanned codes are stored only in your browser's localStorage
- Camera feed is never recorded or transmitted

## Troubleshooting

### Camera won't start
- Ensure you've granted camera permission
- Check that no other app is using the camera
- Try refreshing the page

### Codes not scanning
- Ensure good lighting
- Hold the device steady
- Position the code within the scanning area
- Clean the camera lens

### No sound
- Check device volume
- Tap anywhere on the page first (required for audio on mobile)
- Some browsers require user interaction before playing audio

## License

MIT
