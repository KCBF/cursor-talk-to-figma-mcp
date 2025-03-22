import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Store clients by channel
const channels = new Map<string, Set<WebSocket>>();

function handleConnection(ws: WebSocket) {
  // Don't add to clients immediately - wait for channel join
  console.log("New client connected");

  // Send welcome message to the new client
  ws.send(JSON.stringify({
    type: "system",
    message: "Please join a channel to start chatting",
  }));

  ws.on('close', () => {
    console.log("Client disconnected");

    // Remove client from their channel
    channels.forEach((clients, channelName) => {
      if (clients.has(ws)) {
        clients.delete(ws);

        // Notify other clients in same channel
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "system",
              message: "A user has left the channel",
              channel: channelName
            }));
          }
        });
      }
    });
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
  });
  res.end('WebSocket server running');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  handleConnection(ws);

  ws.on('message', (message: string | Buffer) => {
    try {
      console.log("Received message from client:", message.toString());
      const data = JSON.parse(message.toString());

      if (data.type === "join") {
        const channelName = data.channel;
        if (!channelName || typeof channelName !== "string") {
          ws.send(JSON.stringify({
            type: "error",
            message: "Channel name is required"
          }));
          return;
        }

        // Create channel if it doesn't exist
        if (!channels.has(channelName)) {
          channels.set(channelName, new Set());
        }

        // Add client to channel
        const channelClients = channels.get(channelName)!;
        channelClients.add(ws);

        // Notify client they joined successfully
        ws.send(JSON.stringify({
          type: "system",
          message: `Joined channel: ${channelName}`,
          channel: channelName
        }));

        console.log("Sending message to client:", data.id);

        ws.send(JSON.stringify({
          type: "system",
          message: {
            id: data.id,
            result: "Connected to channel: " + channelName,
          },
          channel: channelName
        }));

        // Notify other clients in channel
        channelClients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "system",
              message: "A new user has joined the channel",
              channel: channelName
            }));
          }
        });
        return;
      }

      // Handle regular messages
      if (data.type === "message") {
        const channelName = data.channel;
        if (!channelName || typeof channelName !== "string") {
          ws.send(JSON.stringify({
            type: "error",
            message: "Channel name is required"
          }));
          return;
        }

        const channelClients = channels.get(channelName);
        if (!channelClients || !channelClients.has(ws)) {
          ws.send(JSON.stringify({
            type: "error",
            message: "You must join the channel first"
          }));
          return;
        }

        // Broadcast to all clients in the channel
        channelClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            console.log("Broadcasting message to client:", data.message);
            client.send(JSON.stringify({
              type: "broadcast",
              message: data.message,
              sender: client === ws ? "You" : "User",
              channel: channelName
            }));
          }
        });
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });
});

const PORT = 3055;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
