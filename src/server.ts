import { actionHandler } from './actions/actionHandler'
import { getLogger } from './logger'
import { getBotInstance } from './bot'
import { setupWorkers } from './workers.ts'

const logger = getLogger('ws-process')

const BASE_PATH = './public'

logger.info('Welcome to MariyAI Takeuchi! 🦆 This Twitch companion is powered')
logger.info(
    'by Bun 🐰 and also serves up the Duck Resort 🏝️  Godot WebGL build.',
)

// Initialize the bot
const bot = getBotInstance()
bot.createInstance()

await bot.connect()

// Initialize the worker queue
await setupWorkers(bot)

logger.info('Waiting for queue to start up...')
await bot.getQueue().isReady()

logger.info('✅ Queue is ready.')

const port = process.env.PORT || 5523
Bun.serve({
    port,
    async fetch(req, server) {
        const url = new URL(req.url)

        // log ip address
        const ip =
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip')

        logger.info(`[${ip || '???'}] ${req.method} ${req.url}`)

        if (url.pathname === '/health') {
            return new Response('OK')
        }

        if (url.pathname === '/game') {
            if (server.upgrade(req)) {
                return
            }

            return new Response('Upgrade failed', { status: 500 })
        }

        // next try to match a static file
        const filePath = BASE_PATH + url.pathname
        const file = Bun.file(filePath)

        if (await file.exists()) {
            // @ts-ignore
            return new Response(file)
        }

        // finally, return a 404 if nothing else matches
        return new Response('Not found', { status: 404 })
    },
    websocket: {
        open(_): void | Promise<void> {
            logger.info('New client connected')
        },
        async message(ws, message): Promise<void> {
            const data = Buffer.from(message).toString()
            logger.info('Received message: ' + data)

            await actionHandler(data, ws)
        },
        close(ws, code, reason): void | Promise<void> {
            logger.info(
                `[${
                    ws.remoteAddress || 'address N/A'
                }] closed with code: ${code}, reason: ${
                    reason.toString() || 'Unknown'
                }`,
            )
        },
        drain(_): void | Promise<void> {
            logger.info('WebSocket drained')
        },
    },
})

// Websocket keepalive every once in a while to make NGINX happy (the default is 60 seconds I think)
logger.info('Starting keepalive ping to sockets')
setInterval(() => {
    logger.info('🔄 Sending keepalive ping to sockets')
    bot.pingSockets()
}, 15_000)

logger.info('🐰 Bun server started! Listening on http://localhost:' + port)
