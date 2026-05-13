import User from "../models/user.js";

export const connections = {};

export const addClient = async (userId, res) => {
  connections[userId] = res;
  
  // Update lastSeen to now (Online)
  try {
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
  } catch (err) {
    console.error("Error updating lastSeen on connect:", err);
  }

  // SSE data event
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  res.on("close", async () => {
    delete connections[userId];
    console.log("Client disconnected", userId);
    
    // Update lastSeen on disconnect
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (err) {
      console.error("Error updating lastSeen on disconnect:", err);
    }
  });
};

export const isUserOnline = (userId) => {
  return !!connections[userId];
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
