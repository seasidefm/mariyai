import {Action, actionHandler} from "./actions/actionHandler";
import {getLogger} from "./logger";
import {getBotInstance} from "./bot";
import {getCache} from "./state/memoryCache.ts";
import {DefaultUserState, UserDuckState} from "./state/stateTypes.ts";

const logger = getLogger("ws-process");

logger.info("Starting bun websocket server...");

const BASE_PATH = "./public";

// Initialize the bot
const bot = getBotInstance();
bot.createInstance();

await bot.connect();

const workerQueue = bot.getQueue()
const cache = await getCache();

workerQueue.process(async (job) => {
    console.log("Processing job: " + job.id)
    console.log(job.data)
    if (job.data.action === "GIFT_SUB") {
        const {username, normalizedGiftWeight} = job.data

        const userState = await cache.get(username);

        let state: UserDuckState = DefaultUserState
        if (userState) {
        	state = JSON.parse(userState)
        }

        state = {
        	...state,
        	// Scale by 0.2 per sub, increasing multiplier with sub tier/weight
        	scale: state.scale + (0.2 * normalizedGiftWeight)
        }

        // update state in redis
        await cache.set(username, JSON.stringify(state))

        bot.sendToSockets({
            action: Action.SetDuckSize,
            data: {
                username,
                scale: state.scale
            }
        })
    }
})

Bun.serve({
    port: process.env.PORT || 5523,
    async fetch(req, server) {
        const url = new URL(req.url);

        // log ip address
        const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

        logger.info(`[${ip || '???'}] ${req.method} ${req.url}`);

        if (url.pathname === "/health") {
            return new Response("OK");
        }

        if (url.pathname === "/game") {
            if (server.upgrade(req)) {
                return;
            }

            return new Response("Upgrade failed", {status: 500});
        }

        // next try to match a static file
        const filePath = BASE_PATH + url.pathname;
        const file = Bun.file(filePath);

        if (await file.exists()) {
            return new Response(file)
        }

        // finally, return a 404 if nothing else matches
        return new Response("Not found", {status: 404});
    },
    websocket: {
        open(_): void | Promise<void> {
            logger.info("New client connected");
        },
        async message(ws, message): Promise<void> {
            const data = Buffer.from(message).toString();
            logger.info("Received message: " + data);

            await actionHandler(data, ws)
        },
        close(ws, code, reason): void | Promise<void> {
            logger.info(
                `[${ws.remoteAddress || 'address N/A'}] closed with code: ${code}, reason: ${reason.toString() || "Unknown"}`
            );
        },
        drain(_): void | Promise<void> {
            logger.info("WebSocket drained");
        }
    }
})

// Websocket keepalive every once in a while to make NGINX happy (the default is 60 seconds I think)
setInterval(() => {
    logger.info("Calling bot pingSockets feature")
    bot.pingSockets()
}, 15_000)
