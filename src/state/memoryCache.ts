import {createClient, type RedisClientType} from "redis";
import {getLogger} from "../logger.ts";

const logger = getLogger("cache")

export class MemoryCache {
  private client: RedisClientType;
  constructor() {
    const connectionString = process.env.REDIS_URL;

    if (!connectionString) {
      throw new Error("No redis connection string provided");
    }

    this.client = createClient({
      url: connectionString
    });
  }

  public async init() {
    logger.info("Initializing Redis client")
    await this.client.connect()
  }

  public async destroy() {
    logger.info("Destroying Redis client")
    await this.client.disconnect()
  }

  public get(key: string): Promise<string | null> {
    logger.debug(`Getting key: ${key}`)
    return this.client.get(key);
  }

  public set(key: string, data: string): Promise<string | null> {
    return this.client.set(key, data)
  }
}


let cacheInstance: MemoryCache;
export async function getCache() {
  if (cacheInstance) return cacheInstance

  logger.debug("No cache instance found, initializing")
  cacheInstance = new MemoryCache()
  await cacheInstance.init()

  return cacheInstance
}
