import { BasePromo, RewardTier } from './base.ts'

export class GenericPromo extends BasePromo {
    public getPromo() {
        return 'GenericPromo'
    }

    public getActive() {
        // TODO: Disable this line to re-enable mounts
        return false

        // Active in December, before the 26th
        const now = new Date()
        const month = now.getMonth()

        return month !== 11
    }
}
