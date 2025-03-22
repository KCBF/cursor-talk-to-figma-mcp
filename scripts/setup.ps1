# Create .cursor directory if it doesn't exist
New-Item -ItemType Directory -Force -Path ".cursor"

# Install dependencies
npm install

# Create mcp.json with the current directory path
$json = @"
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "ts-node",
      "args": [
        "./src/talk_to_figma_mcp/server.ts"
      ]
    }
  }
}
"@

Set-Content -Path ".cursor/mcp.json" -Value $json 