import express from "express";
import enableWs from "express-ws";

import { getLogger } from "./logger";
import { getBotInstance } from "./bot";
import { actionHandler } from "./actions/actionHandler";

const logger = getLogger("server");

const _app = express();
const app = enableWs(_app).app;

const bot = getBotInstance();

// This generally only runs one time, when a socket connects the first time.
app.ws("/game", async (_ws, req) => {
  logger.info("New client connected");

  // Websocket messages are stateful
  _ws.on("message", async (msg) => {
    await actionHandler(msg.toString(), _ws as unknown as WebSocket);
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

app.get("/health", (_, res) => {
  res.send("OK");
});

const port = process.env.PORT || 5000;

app.listen(port, async () => {
  logger.info("Express server listening on port " + port);

  bot.createInstance();

  await bot.connect();
});
