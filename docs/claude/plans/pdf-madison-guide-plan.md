# PDF Generation: Madison Photography Guide Plan

## Summary
Convert the 100-location Madison Photography Guide markdown file to a branded PDF with PhotoVault logo header and footer on every page.

## Source Material
- **Format:** Markdown
- **File:** `docs/MADISON-PHOTOGRAPHY-GUIDE-2025.md` (content updated to 2026)
- **Content type:** Marketing resource / Location guide for photographers
- **Length:** ~2,275 lines, 100 locations with detailed info

## Design Requirements

### Branding
- **Logo:** PhotoVault camera+lock logo in header (every page)
- **Logo file:** `public/images/logos/photovault logo.png`
- **Brand color:** Dark blue (#2A3F5F approximate from logo)

### Layout
- **Margins:** 1 inch all sides
- **Page size:** Letter (8.5" x 11")
- **Orientation:** Portrait
- **Font size:** 11pt body text

### Headers/Footers
- **Header:** PhotoVault logo (centered or left-aligned), small size (~0.5")
- **Footer:** "A Free Resource from PhotoVault" (centered) + page numbers

### Special Elements
- No table of contents (guide is meant for reference, not sequential reading)
- Location entries should have clear visual separation
- GPS coordinates and addresses should be easily readable

## Template Strategy
Create a custom LaTeX header file (`header.tex`) for fancyhdr configuration with:
1. Logo inclusion via `\includegraphics`
2. Custom footer text
3. Page numbers

**Template location:** `docs/assets/header.tex`

## Pandoc Command

```powershell
$pandoc = 'C:\Users\natha\Downloads\pandoc-3.8.3-windows-x86_64\pandoc-3.8.3\pandoc.exe'
$input = 'C:\Users\natha\.cursor\Photo Vault\photovault-hub\docs\MADISON-PHOTOGRAPHY-GUIDE-2025.md'
$output = 'C:\Users\natha\.cursor\Photo Vault\photovault-hub\docs\MADISON-PHOTOGRAPHY-GUIDE-2026.pdf'
$header = 'C:\Users\natha\.cursor\Photo Vault\photovault-hub\docs\assets\header.tex'
$logo = 'C:\Users\natha\.cursor\Photo Vault\photovault-hub\public\images\logos\photovault logo.png'

& $pandoc $input -o $output `
  --pdf-engine=xelatex `
  -V geometry:margin=1in `
  -V fontsize=11pt `
  -H $header `
  -V logo="$logo"
```

## Template Code (header.tex)

```latex
\usepackage{fancyhdr}
\usepackage{graphicx}
\usepackage{lastpage}

% Configure fancy headers
\pagestyle{fancy}
\fancyhf{} % Clear all headers/footers

% Header: Logo on left
\fancyhead[L]{\includegraphics[height=0.4in]{\logo}}
\fancyhead[R]{} % Empty right header

% Footer: Branding text + page number
\fancyfoot[C]{A Free Resource from PhotoVault \quad | \quad Page \thepage}

% Header/footer rules
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0.4pt}

% Apply to first page too
\fancypagestyle{plain}{
  \fancyhf{}
  \fancyhead[L]{\includegraphics[height=0.4in]{\logo}}
  \fancyfoot[C]{A Free Resource from PhotoVault \quad | \quad Page \thepage}
  \renewcommand{\headrulewidth}{0pt}
  \renewcommand{\footrulewidth}{0.4pt}
}
```

## Required Assets
- **Logo:** `public/images/logos/photovault logo.png` (exists)
- **Fonts:** System default (no custom fonts needed)
- **Images:** None embedded in guide

## Testing Steps
1. Create `header.tex` template file
2. Run pandoc conversion command
3. Verify output:
   - [ ] Logo appears in header on all pages
   - [ ] Footer text "A Free Resource from PhotoVault" on all pages
   - [ ] Page numbers present
   - [ ] 100 locations render correctly
   - [ ] GPS coordinates and addresses readable
   - [ ] Checkmarks/X marks render properly (may need Unicode handling)
4. Iterate on spacing/sizing if needed

## Gotchas & Notes

### MiKTeX Packages
May need to auto-install on first run:
- `fancyhdr` - Headers/footers
- `graphicx` - Image inclusion
- `lastpage` - Total page count (if needed)

### Unicode Handling
The markdown contains:
- Checkmarks (✓) and X marks (✗)
- Warning symbols (⚠)
- Degree symbols (°) for GPS

XeLaTeX should handle these natively, but watch for rendering issues.

### File Path Spaces
The logo path contains spaces (`photovault logo.png`). May need escaping or renaming.

### Alternative Approach
If logo-in-header proves problematic, fallback options:
1. Title page only with logo
2. Logo as watermark
3. Simple text header: "PhotoVault | Madison Photography Guide 2026"

## Complexity Assessment
**Moderate** - Custom template with branding, but straightforward conversion. QA review recommended for template syntax verification.
