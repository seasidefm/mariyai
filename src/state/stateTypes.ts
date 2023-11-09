export interface UserDuckState {
    scale: number
    wideness: number
}

export const DefaultUserState: UserDuckState = {
    scale: 1,
    wideness: 0, // amount to add to x and z scales
}
