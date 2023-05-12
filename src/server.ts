import express from "express";
import enableWs from "express-ws";

import { getLogger } from "./logger";
import Bot from "./bot";

const logger = getLogger("server");

const _app = express();
const app = enableWs(_app).app;

const bot = new Bot();

enum Action {
  FirstLoad = "FIRST_LOAD",
  GetState = "GET_STATE",
}

type Payload =
  | {
      action: Action.FirstLoad;
      data: {
        clientName: string;
      };
    }
  | {
      action: Action.GetState;
    };

// This generally only runs one time, when a socket connects the first time.
app.ws("/game", async (_ws, req) => {
  logger.info("New client connected");

  // Websocket messages are stateful
  _ws.on("message", (msg) => {
    try {
      logger.info("Received message: " + msg);
      const data: Payload = JSON.parse(msg.toString());

      // TODO: Extract this to a separate function
      switch (data.action) {
        case Action.FirstLoad: {
          bot.addSocket(data.data.clientName, _ws as unknown as WebSocket);

          break;
        }

        case Action.GetState: {
          _ws.send(JSON.stringify({ state: "woohoo" }));
          break;
        }

        default: {
          const error = `Cannot find action in payload: ` + msg;
          logger.error(error);

          _ws.send(error);
        }
      }
    } catch (e) {
      logger.error(`Cannot parse JSON from msg: ${msg}`);
      _ws.send(
        JSON.stringify({
          error: "Cannot parse JSON, please check payload",
        })
      );
    }
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
