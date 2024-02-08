import tmi from 'tmi.js'
import colors from 'colors'
import { config } from 'dotenv'

import { getLogger } from './logger'
import { commandMapGenerator, messageCommandParser } from './commands'
import { ServerWebSocket } from 'bun'
import { Action, Payload } from './actions/actionHandler'
import { onGiftSubEvent } from './eventHandlers/onGiftSub.ts'
import { getCache } from './state/memoryCache.ts'
import Queue from 'bull'
import { matchStreamElementsTip } from './tips/streamelements.ts'
import { onBitCheer } from './eventHandlers/onBitCheer.ts'
import { JobType } from './eventHandlers/jobTypes.ts'
import { DuckScaleJob, DuckWidenessJob } from './workers.ts'

export const logger = getLogger('mariyai')

config()

const CHANNELS = process.env.CHANNELS?.split(',') || []

export class Bot {
    private readonly options: tmi.Options
    private client: tmi.Client | null = null
    private readonly jobQueue: Queue.Queue

    private readonly sockets: {
        [key: string]: ServerWebSocket
    }

    constructor() {
        const channels = CHANNELS

        if (!Bun.env.REDIS_URL) {
            throw new Error('REDIS_URL not set')
        }

        this.jobQueue = new Queue('mariyai', Bun.env.REDIS_URL)
        this.jobQueue.on('error', (err) => {
            logger.error('Queue error: ' + err)
        })

        this.options = {
            connection: {
                reconnect: true,
                secure: true,
            },
            identity: {
                username: 'MariyAI_Takeuchi',
                password: 'oauth:' + process.env.BOT_ACCESS_TOKEN,
            },
            channels,
        }

        this.sockets = {}
    }

    public addSocket(name: string, sock: ServerWebSocket) {
        if (this.sockets[name]) {
            logger.warn(`Socket ${name} already exists, adding +1 to name`)
            this.addSocket(name + '+1', sock)
        } else {
            this.sockets[name] = sock
        }
    }

    // Only call this once
    public createInstance() {
        logger.info('Initializing bot...')

        const client = new tmi.Client(this.options)

        client.on('connected', async () => {
            logger.info('MariyAI_Takeuchi connected to twitch')

            for (const channel of CHANNELS) {
                await client.say(
                    `#${channel}`,
                    `MariyAI_Takeuchi v${process.env.npm_package_version} is online!`,
                )
            }
        })

        client.on('message', async (channel, tags, message, isSelf) => {
            if (isSelf) return

            const command = messageCommandParser(message)
            const commandMap = commandMapGenerator(this, channel)
            const streamElementsTipData = matchStreamElementsTip(
                tags['display-name'] || '',
                message,
            )

            // Handle tips
            if (streamElementsTipData) {
                logger.info(
                    `StreamElements tip detected: ${streamElementsTipData.username} tipped equivalent of ${streamElementsTipData.subEquivalency} subs`,
                )

                const queue = this.getQueue()
                const job: DuckScaleJob = {
                    action: JobType.Tip,
                    username: streamElementsTipData.username,
                    normalizedGiftWeight: streamElementsTipData.subEquivalency,
                    subscriptionTier: 1,
                }

                await queue.add(job)
            }

            // Handle commands
            if (command && commandMap[command]) {
                logger.info(
                    `${colors.blue(channel)} ${
                        tags['display-name']
                    } - ${message}`,
                )

                const isSub = tags['subscriber']

                if (!isSub) {
                    logger.info(
                        `User ${tags['display-name']} is not a sub, not executing command`,
                    )

                    return bot?.sendMessage(
                        channel,
                        `@${tags.username}, due to development time and effort, Duck Resort is subscriber only.`,
                    )
                }

                await commandMap[command]({
                    client,
                    currentChannel: channel,
                    user: tags['display-name'] as string,
                    message,
                    tags,
                })
            }
        })

        // Register event handlers
        onGiftSubEvent(
            client,
            async (username, normalizedGiftWeight, subscriptionTier) => {
                const queue = this.getQueue()
                const job: DuckScaleJob = {
                    action: JobType.GiftSub,
                    username,
                    normalizedGiftWeight,
                    subscriptionTier: subscriptionTier || 1,
                }

                await queue.add(job)
            },
        )

        onBitCheer(client, async (username, bitsInUSD) => {
            logger.info(
                `Bit cheer detected: ${username} cheered equivalent of $${bitsInUSD}`,
            )
            const queue = this.getQueue()
            const job: DuckWidenessJob = {
                action: JobType.BitCheer,
                username,
                bitsInUSD,
            }

            const res = await queue.add(job)

            logger.info(`Job added to queue: ${res.id}`)
        })

        this.client = client
    }

    public botConnected(): boolean {
        return !!this.client
    }

    public async connect() {
        if (!this.client) {
            logger.error(
                'Cannot connect to client, please run createInstance first!',
            )
        }

        await this.client?.connect()
    }

    public async disconnect() {
        if (!this.client) {
            logger.error('Cannot disconnect since client is null')
        }

        await this.client?.disconnect()
    }

    // Outbound messages
    // =====================
    public async sendMessage(channel: string, message: string) {
        await this.client!.say(channel, message)
    }

    public sendToSockets(message: Payload) {
        const sockets = Object.keys(this.sockets)

        for (const socket of sockets) {
            logger.info(
                `-> Sending message to socket ${socket}: ${JSON.stringify(
                    message,
                )}`,
            )
            this.sockets[socket].send(JSON.stringify(message))
        }
    }

    public async updateDuckState() {
        const cache = await getCache()

        const duckState = await cache.get('SeasideFM')

        if (duckState) {
            this.sendToSockets({
                action: Action.SetDuckSize,
                data: {
                    username: 'SeasideFM',
                    scale: JSON.parse(duckState).scale,
                    wideness: JSON.parse(duckState).wideness,
                },
            })
        }
    }

    public getQueue() {
        return this.jobQueue
    }

    public pingSockets() {
        const sockets = Object.keys(this.sockets)

        for (const socket of sockets) {
            try {
                const status = this.sockets[socket].send(
                    JSON.stringify({
                        action: 'PING',
                        data: {
                            timestamp: Date.now(),
                        },
                    }),
                )

                if (status == 0) {
                    logger.info(
                        `Socket ${socket} is unavailable or closed, removing from list`,
                    )

                    this.sockets[socket].close()

                    delete this.sockets[socket]
                } else if (status == -1) {
                    logger.info(
                        `Socket ${socket} is just overloaded, don't remove from list`,
                    )
                } else {
                    logger.info(`Socket ${socket} pinged with status ${status}`)
                }
            } catch (e) {
                logger.error(`Error pinging/closing socket ${socket}: ${e}`)
                delete this.sockets[socket]
            }
        }
    }
}

let bot: Bot | null = null

/**
 * Get or create the bot singleton to use across the app
 */
export function getBotInstance(): Bot {
    if (!bot) {
        bot = new Bot()
    }

    return bot
}
