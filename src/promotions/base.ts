import { WeeklyDuckState } from '../state/stateTypes.ts'

export enum RewardTier {
    Ineligible,
    Low,
    Medium,
    High,
}

export class BasePromo {
    // Certain things happen at certain tiers for each promotion
    public bitTiers: Map<RewardTier, number> = new Map([
        [RewardTier.Low, 500],
        [RewardTier.Medium, 1500],
        [RewardTier.High, 5000],
    ])

    public subTiers: Map<RewardTier, number> = new Map([
        [RewardTier.Low, 5],
        [RewardTier.Medium, 10],
        [RewardTier.High, 15],
    ])

    // TODO: Convert these into sub equivalent values
    // This will usually correspond to the bit tiers
    public tipTiers: Map<RewardTier, number> = new Map([
        [RewardTier.Low, 2],
        [RewardTier.Medium, 4],
        [RewardTier.High, 10],
    ])

    constructor() {
        console.log('BasePromo constructor')
    }

    public getPromo() {
        return 'BasePromo'
    }

    public getActive() {
        return false
    }

    public getEligibleTiers(stats: WeeklyDuckState) {
        const { donatedBits, giftedSubs, tippedAmount } = stats
        const bitTier = this.getBitTierThreshold(donatedBits)
        const subTier = this.getSubTierThreshold(giftedSubs)
        const tipTier = this.getTipTierThreshold(tippedAmount)

        return {
            bits: bitTier,
            subs: subTier,
            tips: tipTier,
        }
    }

    public getBitTierThreshold(bitsDonated: number) {
        let closestTier = RewardTier.Ineligible
        // reversed to start with largest
        for (const [tier, threshold] of [...this.bitTiers].reverse()) {
            if (bitsDonated >= threshold) {
                closestTier = tier
                break
            }
        }

        return closestTier
    }

    public getSubTierThreshold(subMonths: number) {
        let closestTier = RewardTier.Ineligible
        for (const [tier, threshold] of [...this.subTiers].reverse()) {
            if (subMonths >= threshold) {
                closestTier = tier
                break
            }
        }

        return closestTier
    }

    public getTipTierThreshold(tipAmount: number) {
        let closestTier = RewardTier.Ineligible
        for (const [tier, threshold] of [...this.tipTiers].reverse()) {
            if (tipAmount >= threshold) {
                closestTier = tier
                break
            }
        }

        return closestTier
    }
}
