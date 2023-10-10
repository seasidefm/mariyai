import {actionHandler} from "./actions/actionHandler";
import {getLogger} from "./logger";
import {getBotInstance} from "./bot";

const logger = getLogger("ws-process");

logger.info("Starting bun websocket server...");

const BASE_PATH = "./public";

// Initialize the bot
const bot = getBotInstance();
bot.createInstance();

await bot.connect();

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

        // finally, return a 404
        return new Response("Not found", {status: 404});
    },
    websocket: {
        open(ws): void | Promise<void> {
            logger.info("New client connected");
        },
        async message(ws, message): Promise<void> {
            const data = Buffer.from(message).toString();
            logger.info("Received message: " + data);

            await actionHandler(data, ws)
        },
        close(ws, code, reason): void | Promise<void> {
            logger.info(
                `WebSocket closed with code: ${code}, reason: ${reason.toString()}`
            );
        },
        drain(ws): void | Promise<void> {
            logger.info("WebSocket drained");
        }
    }
})
