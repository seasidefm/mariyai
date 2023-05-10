import tmi from "tmi.js";
import colors from "colors";
import { config } from "dotenv";

import { logger } from "./logger";
import { commandMapGenerator, messageCommandParser } from "./commands";

logger.info("Starting MariyAI_Takeuchi bot!");

config();

const channels = ["duke_ferdinand"];
const client = new tmi.Client({
  connection: {
    reconnect: true,
    secure: true,
  },
  identity: {
    username: "MariyAI_Takeuchi",
    password: "oauth:" + process.env.BOT_ACCESS_TOKEN,
  },
  channels,
});

client.on("connected", () => {
  logger.info("MariyAI_Takeuchi connected to twitch");
});

client.on("message", async (channel, tags, message, isSelf) => {
  if (isSelf) return;

  const command = messageCommandParser(message);
  const commandMap = commandMapGenerator();

  if (command && commandMap[command]) {
    logger.info(`${colors.blue(channel)} ${tags["display-name"]} - ${message}`);
    await commandMap[command](client, {
      currentChannel: channel,
      user: tags["display-name"] as string,
      message,
      tags,
    });
  }
});

client.connect();
