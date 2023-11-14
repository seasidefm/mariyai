import tmi from 'tmi.js'
import { type Bot, logger } from '../bot'
import { Action } from '../actions/actionHandler'
import {
    testBitsMessage,
    testGiftMessage,
    testGiftPackMessage,
} from '../eventHandlers/testEvents.ts'
import { getCache } from '../state/memoryCache.ts'
import { getDefaultUserState } from '../utils/getDefaultUserState.ts'

enum Command {
    Help = '!help',
    Grow = '!grow',
    Spawn = '!spawn',
    Jump = '!jump',
    Run = '!run',
    Quack = '!quack',

    TestGift = '>test gift',
    TestGiftPack = '>test giftpack',
    TestBits = '>test bits',
    // TestSubscription = ">test sub"
}

// Note: some features in here are secret Easter eggs, like quack
const helpMsg = `
MariyAI_Takeuchi commands (subs only):

!grow: how to grow your duck |
!spawn: spawn in a duck |
!run: make your duck run around |
!jump: make your duck jump
`

const growMsg = `
How to grow your duck:

Gift Subs/Tips: duck gets BIG | 
Bits: duck gets W I D E
`

export type CommandHandler<R = void> = (args: {
    client: tmi.Client
    currentChannel: string
    user: string
    message: string
    tags: tmi.ChatUserstate
}) => Promise<R>

const commands = Object.values(Command)
export function messageCommandParser(message: string): Command | null {
    const command = commands.find((cmd) => message.startsWith(cmd))

    if (command) {
        return command
    }

    return null
}

export function commandMapGenerator(
    bot: Bot,
    channel: string,
): Record<Command, CommandHandler> {
    return {
        [Command.Help]: async () => {
            await bot.sendMessage(channel, helpMsg)
        },

        [Command.Grow]: async () => {
            await bot.sendMessage(channel, growMsg)
        },

        [Command.Spawn]: async (args) => {
            // check if user is subbed
            const isSub = args.tags['subscriber']

            if (!isSub) {
                logger.info(`User ${args.user} is not a sub, not spawning duck`)

                return await bot.sendMessage(
                    channel,
                    `@${args.user}, due to development time and effort, Duck Resort is subscriber only!`,
                )
            }

            const cache = await getCache()
            logger.info(
                `Spawning a duck with specs: ${args.user}, ${args.tags['color']}`,
            )

            // await bot.sendMessage(channel, `@${args.user} spawning a duck for you!`);

            const username = args.user

            let userState = getDefaultUserState(username, args.tags['badges'])

            const cached = await cache.get(username)
            if (cached) {
                const cachedState = JSON.parse(cached)

                const calculatedScale =
                    cachedState.scale < userState.scale
                        ? userState.scale +
                          (cachedState.scale > 1 ? cachedState.scale - 1 : 0)
                        : cachedState.scale
                logger.info(
                    `User ${username} has cached state, setting scale to ${calculatedScale} + wideness to ${cachedState.wideness}`,
                )

                userState = {
                    ...cachedState,
                    // Scale up if cached state is smaller than current state (means user is higher tier sub),
                    // otherwise ignore since they'll be big enough
                    scale: calculatedScale < 1 ? 1 : calculatedScale, // one time the scale was 0, not sure why. this is a hacky fix
                    wideness: cachedState.wideness || 0,
                }
            }

            bot.sendToSockets({
                action: Action.Spawn,
                data: {
                    username: args.user,
                    color: args.tags['color'] || '#FEFEFE',
                    scale: userState.scale,
                    wideness: userState.wideness,
                },
            })

            // update state in redis
            await cache.set(username, JSON.stringify(userState), 60 * 60 * 12)
        },

        [Command.Jump]: async (args) => {
            const isSub = args.tags['subscriber']

            if (!isSub) {
                logger.info(`User ${args.user} is not a sub`)

                return await bot.sendMessage(
                    channel,
                    `@${args.user}, due to development time and effort, Duck Resort is subscriber only!`,
                )
            }

            bot.sendToSockets({
                action: Action.Jump,
                data: {
                    username: args.user,
                },
            })
        },

        [Command.Run]: async (args) => {
            // await bot.sendMessage(channel, `ZOOOOM - Look at @${args.user} go!`);

            const isSub = args.tags['subscriber']

            if (!isSub) {
                logger.info(`User ${args.user} is not a sub`)

                return await bot.sendMessage(
                    channel,
                    `@${args.user}, due to development time and effort, Duck Resort is subscriber only!`,
                )
            }

            bot.sendToSockets({
                action: Action.Run,
                data: {
                    username: args.user,
                },
            })
        },

        [Command.Quack]: async (args) => {
            // await bot.sendMessage(channel, `QUACK QUACK - @${args.user} is quacking!`);

            const isSub = args.tags['subscriber']

            if (!isSub) {
                logger.info(`User ${args.user} is not a sub`)

                return await bot.sendMessage(
                    channel,
                    `@${args.user}, due to development time and effort, Duck Resort is subscriber only!`,
                )
            }

            bot.sendToSockets({
                action: Action.Quack,
                data: {
                    username: args.user,
                },
            })
        },

        [Command.TestGift]: async (args) => {
            logger.info("Emitting fake 'subgift' event")
            logger.info('MESSAGE HERE ' + args.message)
            const commandArgs = args.message
                .replace(Command.TestGift, '')
                .trim()
                .split(' ')

            if (commandArgs.length > 0) {
                logger.info(`Detected command arguments: ${commandArgs}`)
                try {
                    const count = parseInt(commandArgs[0])

                    if (isNaN(count)) {
                        logger.error(
                            `Invalid count argument: ${commandArgs[0]}`,
                        )
                        await bot.sendMessage(
                            channel,
                            `@${args.user} invalid count argument: ${commandArgs[0]}`,
                        )
                        return
                    }

                    for (const _ of Array(count).fill('')) {
                        testGiftMessage(args.client, args.user)
                    }
                } catch (e) {
                    logger.error(`Error parsing command arguments: ${e}`)
                    logger.error(
                        'Is this actually someone calling with a number?',
                    )
                }
            } else {
                testGiftMessage(args.client, args.user)
            }
        },

        [Command.TestBits]: async (args) => {
            logger.info("Emitting fake 'bitcheer' event")
            logger.info('MESSAGE HERE ' + args.message)
            const commandArgs = args.message
                .replace(Command.TestBits, '')
                .trim()

            if (commandArgs.length > 0) {
                logger.info(`Detected command arguments: ${commandArgs}`)
                try {
                    const count = parseInt(commandArgs)

                    if (isNaN(count)) {
                        logger.error(`Invalid count argument: ${commandArgs}`)
                        await bot.sendMessage(
                            channel,
                            `@${args.user} invalid count argument: ${commandArgs}`,
                        )
                        return
                    }

                    testBitsMessage(args.client, args.user, `${count}`)
                } catch (e) {
                    logger.error(`Error parsing command arguments: ${e}`)
                    logger.error(
                        'Is this actually someone calling with a number?',
                    )
                }
            }
        },

        [Command.TestGiftPack]: async (args) => {
            logger.info("Emitting fake 'gift pack' event")
            testGiftPackMessage(args.client)
        },
    }
}
