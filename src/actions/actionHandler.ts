import { getBotInstance } from "../bot";
import { getLogger } from "../logger";
import {ServerWebSocket} from "bun";

const logger = getLogger("server");
const bot = getBotInstance();

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

export async function actionHandler(msg: string, _ws: ServerWebSocket<unknown>){
  try {
    logger.info("Received message: " + msg);
    const data: Payload = JSON.parse(msg.toString());

    switch (data.action) {
      case Action.FirstLoad: {
        bot.addSocket(data.data.clientName, _ws as ServerWebSocket);

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
}
