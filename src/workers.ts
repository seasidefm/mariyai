import { getCache } from './state/memoryCache.ts'
import { CombinedDuckState } from './state/stateTypes.ts'
import { Action } from './actions/actionHandler.ts'
import type { Bot } from './bot.ts'
import { getLogger } from './logger.ts'
import { JobType } from './eventHandlers/jobTypes.ts'
import { getUserState } from './utils/getUserState.ts'
import { getActivePromotions } from './promotions'

const logger = getLogger('workers')

const MAX_DUCK_SCALE = 12.5
const BIT_WIDNESS_SCALE_INCREASE = 3
const GIFT_SCALE_INCREASE = 0.5

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

async function sendState(
    bot: Bot,
    username: string,
    { daily, weekly }: CombinedDuckState,
) {
    console.log('Sending state to sockets')
    console.log({ daily, weekly })
    const cache = await getCache()
    logger.info('Setting state to: ' + JSON.stringify({ daily, weekly }))

    // update state in redis
    await cache.set(`daily:${username}`, JSON.stringify(daily), 60 * 60 * 12)
    await cache.set(
        `weekly:${username}`,
        JSON.stringify(weekly),
        60 * 60 * 24 * 7,
    )

    bot.sendToSockets({
        action: Action.SetDuckSize,
        data: {
            username,
            ...daily,
            // @ts-ignore
            eligiblePromotions: getActivePromotions().reduce((acc, promo) => {
                return {
                    [promo.getPromo()]: promo.getEligibleTiers(weekly),
                }
            }, {}),
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

            switch (job.data.action) {
                case JobType.BitCheer: {
                    try {
                        const { username, bitsInUSD } =
                            job.data as DuckWidenessJob
                        const { daily, weekly } = await getUserState(username)

                        await sendState(bot, username, {
                            daily: {
                                ...daily,
                                wideness:
                                    daily.wideness +
                                    BIT_WIDNESS_SCALE_INCREASE *
                                        (bitsInUSD / 5),
                            },
                            weekly: {
                                ...weekly,
                                donatedBits:
                                    weekly.donatedBits + bitsInUSD * 100,
                            },
                        })

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

                    const { daily, weekly } = await getUserState(username)

                    const calculatedScale =
                        daily.scale + GIFT_SCALE_INCREASE * normalizedGiftWeight

                    await sendState(bot, username, {
                        daily: {
                            ...daily,
                            // Scale by GIFT_SCALE_INCREASE per sub, increasing multiplier with sub tier/weight until we reach max, then add excess to wideness
                            scale:
                                calculatedScale > MAX_DUCK_SCALE
                                    ? MAX_DUCK_SCALE
                                    : calculatedScale,
                            wideness:
                                calculatedScale > MAX_DUCK_SCALE
                                    ? daily.wideness +
                                      ((calculatedScale - MAX_DUCK_SCALE) /
                                          GIFT_SCALE_INCREASE) *
                                          BIT_WIDNESS_SCALE_INCREASE
                                    : daily.wideness,
                        },
                        weekly: {
                            ...weekly,
                            tippedAmount:
                                job.data.action === JobType.Tip
                                    ? weekly.tippedAmount + normalizedGiftWeight
                                    : weekly.tippedAmount,
                            giftedSubs:
                                job.data.action === JobType.GiftSub
                                    ? weekly.giftedSubs + normalizedGiftWeight
                                    : weekly.giftedSubs,
                            donatedBits: weekly.donatedBits,
                        },
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
