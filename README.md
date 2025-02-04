# Chess Analysis Assistant for Claude
[![smithery badge](https://smithery.ai/badge/chess-mcp)](https://smithery.ai/server/chess-mcp)
This tool helps you analyze chess positions and get professional evaluations using Stockfish, right within Claude! You can:
- Get position evaluations
- See visual board representations
- Analyze different moves and variations
- Look up positions in the masters database (games played by 2200+ rated players)

## Requirements

- [Claude Desktop](https://claude.ai/desktop) installed on your computer
- Git installed on your system

## Quick Installation

### Installing via Smithery

To install Chess Analysis Assistant for Claude Desktop automatically via [Smithery](https://smithery.ai/server/chess-mcp):

```bash
npx -y @smithery/cli install chess-mcp --client claude
```

### Mac and Linux Users

Open Terminal and run this command:
```bash
curl -fsSL https://raw.githubusercontent.com/turlockmike/chess-mcp/master/install.sh | bash
```

That's it! The script will:
1. Install required dependencies (Node.js 20+, Stockfish, Cairo)
2. Configure Claude Desktop
3. Set up the Chess Assistant

## Manual Installation (Windows or Advanced Users)

If you prefer to install manually or are using Windows, follow these steps:

### Requirements

- [Claude Desktop](https://claude.ai/desktop)
- [Node.js](https://nodejs.org/) version 20 or higher
- [Stockfish](https://stockfishchess.org/) chess engine
- [Cairo](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows) graphics library (for board visualization)

### Step-by-Step Installation

#### Step 1: Install Dependencies

**Mac Users:**
```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install stockfish cairo pkg-config jq
```

**Windows Users:**
1. Install [Node.js](https://nodejs.org/) (LTS version)
2. Download [Stockfish](https://stockfishchess.org/download/) and add it to your PATH
3. Install [Cairo](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

#### Step 2: Install Chess Assistant
```bash
npm install -g chess-mcp
```

#### Step 3: Configure Claude Desktop
1. Open Claude Desktop
2. Navigate to the configuration file:
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
3. Add this configuration:

```json
{
    "mcpServers": {
        "chess": {
            "command": "npx",
            "args": ["chess-mcp"]
        }
    }
}
```

4. Save and restart Claude Desktop

## Using the Chess Assistant

1. Open Claude Desktop
2. Look for the tools icon (🔧) - it should show chess analysis tools
3. Try these example prompts:
   - "Analyze this position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
   - "Show me the current position"
   - "What's the best move in this position?"
   - "Look up this position in the masters database"
   - "Show me master games from this position after 2000"
   - "What are the most common moves played by masters in this position?"

## Features

### Position Analysis
- Engine evaluation using Stockfish
- Visual board representation
- Best move suggestions
- Move validation

### Masters Database
- Search positions in games played by 2200+ rated players
- Filter games by date range
- See win/draw statistics
- View most common moves with success rates
- Browse recent master games with player ratings

## Need Help?

If you run into any issues:
1. Make sure all requirements are installed correctly
2. Verify Stockfish is accessible from your command line
3. Check that all paths in your Claude Desktop configuration are correct
4. Restart Claude Desktop after making any changes

## Common Issues

- **"Tools not showing up in Claude"**: Make sure you've configured Claude Desktop correctly
- **"Stockfish not found"**: Verify Stockfish is installed and accessible from the command line
- **"Node version error"**: Make sure you have Node.js version 20 or higher installed
- **"Canvas installation failed"**: Make sure Cairo is installed correctly for your operating system 