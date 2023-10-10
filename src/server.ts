import express from "express";
import enableWs from "express-ws";

import { getLogger } from "./logger";
import { getBotInstance } from "./bot";
import { actionHandler } from "./actions/actionHandler";

const logger = getLogger("server");

// Initialize express and enable websockets
const _app = express();
const app = enableWs(_app).app;

// Serve static files from the Godot WASM build
app.use(express.static("public"));

// Initialize the bot
const bot = getBotInstance();

// This generally only runs one time, when a socket connects the first time.
app.ws("/game", async (_ws, req) => {
  logger.info("New client connected");

  // Websocket messages are stateful
  _ws.on("message", async (msg) => {
    const message = msg.toString();
    console.log(message);
    await actionHandler(message, _ws as unknown as WebSocket);
  });

  _ws.on("error", (err) => {
    logger.error(`WebSocket got error: ${err.message}`);
  });

  _ws.on("close", (code, reason) => {
    logger.info(
      `WebSocket closed with code: ${code}, reason: ${reason.toString()}`
    );
  });
});

// app.get("/game", (req, res) => {
//   res.send({ message: "Hello world" });
// })

app.get("/health", (_, res) => {
  res.send("OK");
});

app.get("/spawn-test", (_, res) => {
  bot.sendToSockets(
    JSON.stringify({
        action: "SPAWN",
        data: {
          username: "test",
          color: "#222222",
        },
      })
  );

  res.send("OK");
})

const port = process.env.PORT || 5000;
const host = process.env.HOST || "localhost";

app.listen(Number(port), host, async () => {
  logger.info(`Server listening on ${host}:${port}!`);

  bot.createInstance();

  await bot.connect();
});
