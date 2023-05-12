import tmi from "tmi.js";
import colors from "colors";
import { config } from "dotenv";

import { getLogger } from "./logger";
import { commandMapGenerator, messageCommandParser } from "./commands";

export const logger = getLogger("mariyai");

config();

export class Bot {
  private options: tmi.Options;
  private client: tmi.Client | null = null;
  private channel: string = "duke_ferdinand";

  private sockets: {
    [key: string]: WebSocket;
  };

  constructor() {
    const channels = [this.channel];

    this.options = {
      connection: {
        reconnect: true,
        secure: true,
      },
      identity: {
        username: "MariyAI_Takeuchi",
        password: "oauth:" + process.env.BOT_ACCESS_TOKEN,
      },
      channels,
    };

    this.sockets = {};
  }

  public addSocket(name: string, sock: WebSocket) {
    logger.info([name, sock]);
    this.sockets[name] = sock;

    logger.info(JSON.stringify(this.sockets));
  }

  // Only call this once
  public createInstance() {
    logger.info("Initializing bot...");

    const client = new tmi.Client(this.options);

    client.on("connected", () => {
      logger.info("MariyAI_Takeuchi connected to twitch");
    });

    client.on("message", async (channel, tags, message, isSelf) => {
      if (isSelf) return;

      const command = messageCommandParser(message);
      const commandMap = commandMapGenerator(this);

      if (command && commandMap[command]) {
        logger.info(
          `${colors.blue(channel)} ${tags["display-name"]} - ${message}`
        );

        await commandMap[command]({
          currentChannel: channel,
          user: tags["display-name"] as string,
          message,
          tags,
        });
      }
    });

    this.client = client;
  }

  public botConnected(): boolean {
    return !!this.client;
  }

  public async connect() {
    if (!this.client) {
      logger.error(
        "Cannot connect to client, please run createInstance first!"
      );
    }

    await this.client?.connect();
  }

  public async disconnect() {
    if (!this.client) {
      logger.error("Cannot disconnect since client is null");
    }

    await this.client?.disconnect();
  }

  // Outbound messages
  // =====================
  public async sendMessage(message: string) {
    this.client?.say(this.channel, message);
  }

  public sendToSockets(message: string) {
    const sockets = Object.keys(this.sockets);

    for (const socket of sockets) {
      this.sockets[socket].send(message);
    }
  }
}

let bot: Bot | null = null;

/**
 * Get or create the bot singleton to use across the app
 * @returns {Bot}
 */
export function getBotInstance() {
  if (!bot) {
    bot = new Bot();
  }

  return bot;
}
