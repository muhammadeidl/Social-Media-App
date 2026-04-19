export const connections = {};

export const addClient = (userId, res) => {
  connections[userId] = res;
  
  // SSE data event
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  res.on("close", () => {
    delete connections[userId];
    console.log("Client disconnected", userId);
  });
};

export const sendEvent = (userId, data, eventType) => {
  if (connections[userId]) {
    if (eventType) {
      connections[userId].write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    } else {
      // Default unnamed message event
      connections[userId].write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
};
