import {getCache} from "./state/memoryCache.ts";
import {DefaultUserState, UserDuckState} from "./state/stateTypes.ts";
import {Action} from "./actions/actionHandler.ts";
import type {Bot} from "./bot.ts";
import {getLogger} from "./logger.ts";
import {
  getDefaultUserState,
  getDefaultUserStateWithSubTier,
  subTierToInitialScale
} from "./utils/getDefaultUserState.ts";

const logger = getLogger("workers");

interface JobData {
    action: "GIFT_SUB" | "TIP"
    username: string
    normalizedGiftWeight: number
    subscriptionTier: number
}

export async function setupWorkers(bot: Bot) {
  logger.info("Setting up workers...")
  const workerQueue = bot.getQueue()
  const cache = await getCache();

  // Don't await this - it will block the bun server from starting
  workerQueue.process(async (job, done) => {
      logger.info("Processing job: " + job.id)
      logger.debug("Job data: " + JSON.stringify(job.data))

      if (job.data.action === "GIFT_SUB" || job.data.action === "TIP") {
          // NOTE: see if subscription tier is the gifter's tier or the gifted tier
          const {username, normalizedGiftWeight, subscriptionTier} = job.data as JobData

          const userState = await cache.get(username);

          let state: UserDuckState = DefaultUserState

          // User state already exists, assume defaults are set correctly
          if (userState) {
            state = JSON.parse(userState)
          }

          state = {
            ...state,
            // Scale by 0.2 per sub, increasing multiplier with sub tier/weight
            scale: state.scale + (0.2 * normalizedGiftWeight)
          }

          logger.info("Setting state to: " + JSON.stringify(state))

          // update state in redis
          await cache.set(username, JSON.stringify(state), 60 * 60 * 12)

          bot.sendToSockets({
              action: Action.SetDuckSize,
              data: {
                  username,
                  scale: state.scale
              }
          })

          done()
      } else {
          logger.error("Unknown job type: " + job.data.action)
          done(new Error("Unknown job type"))
      }
  })

  logger.info("✅ Workers set up")
}