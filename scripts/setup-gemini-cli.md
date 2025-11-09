# Gemini CLI Setup Guide

## Quick Setup

### 1. Get Your API Key

1. Visit: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key" or copy an existing key
4. Copy the key (starts with `AIza...`)

### 2. Set the API Key

#### Option A: Temporary (Current Session Only)

In PowerShell:
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

#### Option B: Permanent (System-Wide)

**Windows:**
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to "Advanced" tab → Click "Environment Variables"
3. Under "User variables", click "New"
4. Variable name: `GEMINI_API_KEY`
5. Variable value: Paste your API key
6. Click OK, OK, OK
7. Restart your terminal/PowerShell

#### Option C: Project-Specific (.env file)

Create a `.env` file in your project root:
```
GEMINI_API_KEY=your-api-key-here
```

### 3. Verify Setup

```powershell
gemini --version
gemini "Hello, test"
```

### 4. Usage Examples

```powershell
# Interactive chat
gemini

# One-shot query
gemini "What is TypeScript?"

# With interactive mode
gemini -i "Help me with my code"

# List available extensions
gemini --list-extensions

# Use specific extensions
gemini -e codebase,git "Review my changes"
```

### 5. Common Commands

- `gemini [query]` - Quick query
- `gemini -i [query]` - Interactive mode
- `gemini --help` - Show all options
- `gemini extensions list` - List extensions
- `gemini mcp` - Manage MCP servers

### Troubleshooting

**"GEMINI_API_KEY not found"**
- Make sure you set the environment variable
- Restart your terminal after setting it
- Check that the key is correct (no extra spaces)

**"API key invalid"**
- Get a fresh key from https://aistudio.google.com/apikey
- Make sure you're using the correct key

**"Command not found"**
- Install with: `npm install -g @google/gemini-cli`
- Make sure Node.js is installed (version 18+)

