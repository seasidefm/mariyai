import tmi from "tmi.js";
import { logger, type Bot } from "../bot";

enum Command {
  Help = "!help",
  Spawn = "!spawn",
}

const helpMsg = `
MariyAI_Takeuchi commands:

!spawn: spawn in a duck (subs only) |
!run: make your duck run around in a circle
`;

export type CommandHandler<R = void> = (args: {
  currentChannel: string;
  user: string;
  message: string;
  tags: tmi.ChatUserstate;
}) => Promise<R>;

export function messageCommandParser(message: string): Command | null {
  const regex = /^!(\w+)/; // Matches "!command"

  const match = message.match(regex);
  if (match) {
    const command = match[0] as Command;

    if (Object.values(Command).includes(command)) {
      return command;
    }
  }

  return null;
}

export function commandMapGenerator(bot: Bot, channel: string) {
  const commandMap: Record<Command, CommandHandler> = {
    [Command.Help]: async () => {
      await bot.sendMessage(channel, helpMsg);
    },
    [Command.Spawn]: async (args) => {
      logger.info(
        `Spawning a duck with specs: ${args.user}, ${args.tags["color"]}`
      );

      await bot.sendMessage(channel, `@${args.user} spawning a duck for you!`);

      bot.sendToSockets(
        JSON.stringify({
          action: "SPAWN",
          data: {
            username: args.user,
            color: args.tags["color"] || "#FEFEFE",
          },
        })
      );
    },
  };

  return commandMap;
}
