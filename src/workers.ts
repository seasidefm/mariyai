import { getCache } from './state/memoryCache.ts'
import { DefaultUserState, UserDuckState } from './state/stateTypes.ts'
import { Action } from './actions/actionHandler.ts'
import type { Bot } from './bot.ts'
import { getLogger } from './logger.ts'
import { JobType } from './eventHandlers/jobTypes.ts'

const logger = getLogger('workers')

export type DuckScaleJob = {
    action: JobType.GiftSub | JobType.Tip
    username: string
    normalizedGiftWeight: number
    subscriptionTier: number
}

export type DuckWidenessJob = {
    action: JobType.BitCheer
    username: string
    bitsInUSD: number
}

async function getState(username: string) {
    const cache = await getCache()
    const userState = await cache.get(username)

    let state: UserDuckState = DefaultUserState

    // User state already exists, assume defaults are set correctly
    if (userState) {
        state = JSON.parse(userState)
    }

    return {
        ...state,
        scale: state.scale || 1.0,
        wideness: state.wideness || 0, // some existing users don't have this field
    }
}

async function sendState(bot: Bot, username: string, state: UserDuckState) {
    const cache = await getCache()
    logger.info('Setting state to: ' + JSON.stringify(state))

    // update state in redis
    await cache.set(username, JSON.stringify(state), 60 * 60 * 12)

    bot.sendToSockets({
        action: Action.SetDuckSize,
        data: {
            username,
            ...state,
        },
    })
}

export async function setupWorkers(bot: Bot) {
    logger.info('Setting up workers...')
    const workerQueue = bot.getQueue()

    // Don't await this - it will block the bun server from starting
    workerQueue
        .process(async (job, done) => {
            logger.info('Processing job: ' + job.id)
            logger.debug('Job data: ' + JSON.stringify(job.data))
            console.log('Job data: ' + JSON.stringify(job.data))

            switch (job.data.action) {
                case JobType.BitCheer: {
                    try {
                        const { username, bitsInUSD } =
                            job.data as DuckWidenessJob
                        const initialState = await getState(username)
                        const state = {
                            ...initialState,
                            width:
                                initialState.wideness + 0.6 * (bitsInUSD / 5),
                        }

                        // const newWideness =
                        //     initialState.wideness + 0.4 * (bitsInUSD / 5)
                        //
                        // console.log(`New wideness: ${newWideness}`)

                        // Wideness can't be more than 8 - anything higher and it looks bad
                        // if (newWideness > 8) {
                        //     // trim off the excess and add it to the scale instead
                        //     state.scale += newWideness - 8
                        //     state.wideness = 8
                        // } else {
                        //     state.wideness = newWideness
                        // }

                        await sendState(bot, username, state)

                        done()
                    } catch (err) {
                        logger.error('Error processing job: ' + err)
                        done(err as Error)
                    }
                    break
                }

                case JobType.GiftSub:
                case JobType.Tip: {
                    // NOTE: see if subscription tier is the gifter's tier or the gifted tier
                    const { username, normalizedGiftWeight, subscriptionTier } =
                        job.data as DuckScaleJob

                    const initialState = await getState(username)

                    await sendState(bot, username, {
                        ...initialState,
                        // Scale by 0.2 per sub, increasing multiplier with sub tier/weight
                        scale: initialState.scale + 0.2 * normalizedGiftWeight,
                    })
                    done()
                    break
                }
                default: {
                    logger.error('Unknown job type: ' + job.data.action)
                    done(new Error('Unknown job type'))
                }
            }
        })
        .then(() => {
            logger.info('✅ Workers set up')
        })
        .catch((err) => {
            logger.error('Error setting up workers: ' + err)
        })

    logger.info('✅ Workers set up')
}
