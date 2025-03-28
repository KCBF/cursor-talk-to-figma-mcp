#!/bin/bash

# Create .cursor directory if it doesn't exist
mkdir -p .cursor

# Install dependencies
npm install

# Create mcp.json with the current directory path
echo '{
  "mcpServers": {
    "TalkToFigma": {
      "command": "node",
      "args": [
        "./src/talk_to_figma_mcp/server.ts"
      ]
    }
  }
}' > .cursor/mcp.json 