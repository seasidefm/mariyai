import tmi from "tmi.js";
import {type Bot, logger} from "../bot";
import {Action} from "../actions/actionHandler";
import {testGiftMessage, testGiftPackMessage} from "../eventHandlers/testEvents.ts";
import {getCache} from "../state/memoryCache.ts";
import {DefaultUserState, UserDuckState} from "../state/stateTypes.ts";

enum Command {
  Help = "!help",
  Spawn = "!spawn",
  Run = "!run",

  TestGift = ">test gift",
  TestGiftPack = ">test giftpack",
  // TestSubscription = ">test sub"
}

const helpMsg = `
MariyAI_Takeuchi commands:

!spawn: spawn in a duck (subs only) |
!run: make your duck run around in a circle
`;

export type CommandHandler<R = void> = (args: {
  client: tmi.Client;
  currentChannel: string;
  user: string;
  message: string;
  tags: tmi.ChatUserstate;
}) => Promise<R>;

export function messageCommandParser(message: string): Command | null {
  const regex = /^([!>])(\w+)(?:\s+(\w+))?$/; // Matches "!command" or ">command" or ">command secondWord"

  const match = message.match(regex);
  if (match) {
    const command = match[0] as Command;

    if (Object.values(Command).includes(command)) {
      return command;
    }
  }

  return null;
}

export function commandMapGenerator(bot: Bot, channel: string): Record<Command, CommandHandler> {
  return {
    [Command.Help]: async () => {
      await bot.sendMessage(channel, helpMsg);
    },

    [Command.Spawn]: async (args) => {
      const cache = await getCache();
      logger.info(
        `Spawning a duck with specs: ${args.user}, ${args.tags["color"]}`
      );

      // await bot.sendMessage(channel, `@${args.user} spawning a duck for you!`);

      const username = args.user;
      let userState: UserDuckState = username === "SeasideFM" ? {
        scale: 5
      } : DefaultUserState;

      const cached = await cache.get(username)
      if (cached) {
        userState = JSON.parse(cached);
      }

      bot.sendToSockets({
        action: Action.Spawn,
        data: {
          username: args.user,
          color: args.tags["color"] || "#FEFEFE",
          scale: userState.scale
        },
      });
    },

    [Command.Run]: async (args) => {
      // await bot.sendMessage(channel, `ZOOOOM - Look at @${args.user} go!`);

      bot.sendToSockets({
        action: Action.Run,
        data: {
          username: args.user
        }
      })
    },

    [Command.TestGift]: async (args) => {
      logger.info("Emitting fake 'subgift' event")
      testGiftMessage(args.client, args.user)
    },

    [Command.TestGiftPack]: async (args) => {
      logger.info("Emitting fake 'gift pack' event")
      testGiftPackMessage(args.client)
    },
  };
}
