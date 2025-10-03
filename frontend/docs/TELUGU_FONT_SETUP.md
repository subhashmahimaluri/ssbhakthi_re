# Telugu Font Setup Guide

## Current Font Configuration

The application uses a priority-based font stack for Telugu content:

```scss
$font-family-telugu:
  'NATS', 'Noto Sans Telugu', 'Noto Serif Telugu', 'Gautami', 'Raavi', sans-serif;
```

### Font Priority Order:

1. **NATS** - Local font (if installed)
2. **Noto Sans Telugu** - Google Fonts (multiple weights: 100-900 including bold 700)
3. **Noto Serif Telugu** - Google Fonts (serif style with multiple weights)
4. **Gautami** - System font fallback
5. **Raavi** - System font fallback
6. **serif** - Generic serif fallback

## Installing NATS Font Locally (Optional)

To get the best Telugu typography experience, you can install the NATS font locally:

### Download Sources:

- [TeluguFonts.net - NATS Regular](https://telugufonts.net/fonts/nats-regular)
- [Font.Download - NATS](https://font.download/font/nats)

### Installation Steps:

#### Windows:

1. Download the NATS font file (usually `.ttf` or `.otf`)
2. Right-click the font file and select "Install"
3. Restart your browser to load the new font

#### macOS:

1. Download the NATS font file
2. Double-click the font file to open Font Book
3. Click "Install Font"
4. Restart your browser to load the new font

#### Linux:

1. Download the NATS font file
2. Copy to `~/.local/share/fonts/` or `/usr/share/fonts/`
3. Run `fc-cache -fv` to refresh font cache
4. Restart your browser to load the new font

## Web Fonts Used

The application automatically loads these fonts from Google Fonts:

- **Noto Sans Telugu**: Modern sans-serif font with full weight support (100-900) including bold (700), ideal for both headings and body text
- **Noto Serif Telugu**: Modern serif font with multiple weights and full Unicode support

## Font Weights Available

**Noto Sans Telugu** supports all standard font weights:

- **100** - Thin
- **300** - Light
- **400** - Regular (default)
- **500** - Medium
- **600** - Semi Bold
- **700** - Bold
- **800** - Extra Bold
- **900** - Black

**Noto Serif Telugu** supports variable weights from 100 to 900.

## CSS Usage Examples

```css
/* Regular weight */
.telugu-text {
  font-family: 'Noto Sans Telugu', sans-serif;
  font-weight: 400;
}

/* Bold headings */
.telugu-heading {
  font-family: 'Noto Sans Telugu', sans-serif;
  font-weight: 700;
}

/* Light text */
.telugu-light {
  font-family: 'Noto Sans Telugu', sans-serif;
  font-weight: 300;
}
```

## CSS Classes for Telugu Text

Apply Telugu fonts using these CSS classes:

```html
<!-- Basic language class -->
<div class="lang-te">తెలుగు వచనం</div>

<!-- HTML lang attribute -->
<p lang="te">తెలుగు వచనం</p>

<!-- Enhanced Telugu content styling -->
<article class="telugu-content">
  <h1>తెలుగు శీర్షిక</h1>
  <p>తెలుగు వచనం యొక్క వివరణ...</p>
</article>
```

## Font Testing

To verify which font is being used:

1. Open browser developer tools (F12)
2. Select a Telugu text element
3. Check the "Computed" styles tab
4. Look for `font-family` to see which font is active

## Notes

- NATS font provides the most authentic Telugu reading experience
- **Noto Sans Telugu** offers excellent weight support (100-900) making it perfect for headings, bold text, and varied typography
- Noto Serif Telugu provides traditional serif styling with multiple weights
- All Google Fonts are loaded with optimal performance and caching
- System fonts (Gautami, Raavi) ensure basic Telugu text is always readable
