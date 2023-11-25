import { Client } from 'tmi.js'
import { getLogger } from '../logger.ts'

const logger = getLogger('bit-cheer')

type OnEvent = (username: string, bitsInUSD: number) => Promise<void> | void

export function onBitCheer(client: Client, onEvent: OnEvent) {
    client.on('cheer', (channel, state, message) => {
        logger.info(
            `#${channel}: ${state['display-name']} cheered ${state.bits} bits!`,
        )

        console.log(state)

        // state.bits is a stringified number
        const bitsInUSD = parseInt(state.bits || '0') / 100

        // Surface event to listeners
        onEvent(
            state['display-name'] || state.username || 'Anonymous',
            bitsInUSD,
        )
    })
}
