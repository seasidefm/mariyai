import tmi from "tmi.js";

enum Command {
  Help = ">help",
}

const helpMsg = `
MariyAI_Takeuchi commands:

>help: show this help message |
>spawn: spawn in a duck (subs only)
`;

export type CommandHandler<R = void> = (
  client: tmi.Client,
  args: {
    currentChannel: string;
    user: string;
    message: string;
    tags: tmi.Userstate;
  }
) => Promise<R>;

export function messageCommandParser(message: string): Command | null {
  const regex = /^>(\w+)/; // Matches ">command"

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
  };

  return commandMap;
}
