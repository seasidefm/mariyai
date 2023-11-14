## MariyAI (a play on Mariya and AI)

Note: contrary to the name, this bot is not currently connected to my AI Core API! Not sure if it will be in the future.

## What is this?
This is the MariyAI chatbot project! It's written in TypeScript, and uses event-driven architecture to send out websockets to connected clients
based on commands a user calls in chat. For example, `!spawn` will check to see a user's subscription tier, check for cached state, and then send a `SPAWN` command to the connected Duck Resort game.

## How do I use this?
It's not intended to be used on its own, but if you're a new member of the SeasideFM team you can follow this guide!

This project uses Bun.js as the runtime and package manager, so once you have installed that, proceed to the next step.

- Clone this repository
- Run `bun i` to install dependencies
- Run `bun dev` to start the development server

## How do I add a new command?
- Add a new entry to the `Commands` enum in `src/commands` with the name of your command
- TypeScript should start yelling at you to add the implementation lower in the same file!
- Make sure you add a matching `Action` in `src/actions/actionHandler` or you won't be able to surface events to the game clients!

