import {
    CombinedDuckState,
    DefaultUserState,
    DefaultWeeklyState,
    UserDuckState,
    WeeklyDuckState,
} from '../state/stateTypes.ts'
import { getCache } from '../state/memoryCache.ts'

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

const specialUsers = ['duke_ferdinand', 'oldfisheyes', 'tacodog40k']

export async function getUserState(
    username: string,
    badges?: { subscriber?: string },
): Promise<CombinedDuckState> {
    console.log(`${username} has badges: ${JSON.stringify(badges)}`)

    const cache = await getCache()
    const cacheKeys = {
        dailyState: `daily:${username}`,
        weeklyState: `weekly:${username}`,
    }

    const [cachedDaily, cachedWeekly] = await Promise.all([
        cache.get(cacheKeys.dailyState),
        cache.get(cacheKeys.weeklyState),
    ])

    // Cached state! us this as a base
    if (cachedDaily && cachedWeekly) {
        const parsedDaily = JSON.parse(cachedDaily)
        const parsedWeekly = JSON.parse(cachedWeekly)

        return {
            daily: {
                ...DefaultUserState,
                ...parsedDaily,
            },
            weekly: {
                ...DefaultWeeklyState,
                ...parsedWeekly,
            },
        }
    }

    // If no cached state, create a new one
    const state = {
        daily: {
            ...DefaultUserState,
            // Get subscriber tier
            scale: subTierToInitialScale(getSubTier(badges)),
        },
        weekly: DefaultWeeklyState,
    }

    if (username === 'SeasideFM') {
        return {
            ...state,
            daily: {
                scale: 5.0,
                wideness: 0,
            },
            weekly: {
                ...state.weekly,
                donatedBits: 200_000,
            },
        }
    }

    if (specialUsers.includes(username.toLowerCase())) {
        return {
            ...state,
            daily: {
                scale: 2.5,
                wideness: 0,
            },
        }
    }

    return {
        ...state,
    }
}
