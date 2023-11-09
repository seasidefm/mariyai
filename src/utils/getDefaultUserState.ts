import { DefaultUserState, UserDuckState } from '../state/stateTypes.ts'

export function getSubTier(badges?: { subscriber?: string }): number {
    // leading number should be the sub tier? this is the only way I can see to get the sub tier without using an api call on every spawn
    const subBadge = badges?.subscriber || '1001'

    return parseInt(subBadge[0]) || 1
}

export function subTierToInitialScale(subTier: number): number {
    switch (subTier) {
        case 1:
            return 1.0
        case 2:
            return 1.4
        case 3:
            return 2.0
        default:
            return 1.0
    }
}

export function getDefaultUserState(
    username: string,
    badges?: { subscriber?: string },
): UserDuckState {
    console.log(`${username} has badges: ${JSON.stringify(badges)}`)

    return username === 'SeasideFM' || username === 'Duke_Ferdinand'
        ? {
              scale: username === 'SeasideFM' ? 5.0 : 2.5,
          }
        : {
              ...DefaultUserState,
              // Get subscriber tier
              scale: subTierToInitialScale(getSubTier(badges)),
          }
}
