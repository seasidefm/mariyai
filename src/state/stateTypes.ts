export interface UserDuckState {
    scale: number
    wideness: number
}

export const DefaultUserState: UserDuckState = {
    scale: 1,
    wideness: 0, // amount to add to x and z scales
}

export interface WeeklyDuckState {
    donatedBits: number
    giftedSubs: number
    tippedAmount: number
}

export const DefaultWeeklyState: WeeklyDuckState = {
    donatedBits: 0,
    giftedSubs: 0,
    tippedAmount: 0,
}

export interface CombinedDuckState {
    daily: UserDuckState
    weekly: WeeklyDuckState
}
