import tmi from "tmi.js";
import { logger } from "../bot";

enum Command {
  Help = "!help",
  Spawn = "!spawn",
}

const helpMsg = `
MariyAI_Takeuchi commands:

!spawn: spawn in a duck (subs only) |
!run: make your duck run around in a circle
`;

export type CommandHandler<R = void> = (
  client: tmi.Client,
  args: {
    currentChannel: string;
    user: string;
    message: string;
    tags: tmi.ChatUserstate;
  }
) => Promise<R>;

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

export function commandMapGenerator(includeModCommands = false) {
  const commandMap: Record<Command, CommandHandler> = {
    [Command.Help]: async (client, args) => {
      client.say(args.currentChannel, helpMsg);
    },
    [Command.Spawn]: async (client, args) => {
      logger.info(
        `Spawning a duck with specs: ${args.user}, ${args.tags["color"]}`
      );
      client.say(args.currentChannel, "Spawning duck!");
    },
  };

  return commandMap;
}
