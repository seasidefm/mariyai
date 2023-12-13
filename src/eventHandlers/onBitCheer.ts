import { Client } from 'tmi.js'
import { getLogger } from '../logger.ts'
import { getActivePromotions } from '../promotions'
import { RewardTier } from '../promotions/base.ts'

const logger = getLogger('bit-cheer')

type OnEvent = (
    username: string,
    bitsInUSD: number,
    eligiblePromotions?: string[],
) => Promise<void> | void

export function onBitCheer(client: Client, onEvent: OnEvent) {
    client.on('cheer', (channel, state, message) => {
        logger.info(
            `#${channel}: ${state['display-name']} cheered ${state.bits} bits!`,
        )

        // state.bits is a stringified number
        const bitsInUSD = parseInt(state.bits || '0') / 100
        const eligiblePromotions = getActivePromotions().filter(
            (promo) =>
                promo.getBitTierThreshold(bitsInUSD) !== RewardTier.Ineligible,
        )

        // Surface event to listeners
        onEvent(
            state['display-name'] || state.username || 'Anonymous',
            bitsInUSD,
            eligiblePromotions.map((promo) => promo.getPromo()),
        )
    })
}
