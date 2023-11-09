import { Client } from 'tmi.js'
import { getLogger } from '../logger.ts'

const logger = getLogger('bit-cheer')

type OnEvent = (username: string, bitsInUSD: number) => Promise<void> | void

export function onBitCheer(client: Client, onEvent: OnEvent) {
    client.on('cheer', (channel, state, message) => {
        logger.info(
            `#${channel}: ${state.username} cheered ${state.bits} bits!`,
        )

        const bitsInUSD =
            parseInt(state.bits?.replace(' Bits', '') || '0') / 100

        // Surface event to listeners
        onEvent(state.username || 'Anonymous', bitsInUSD)
    })
}
