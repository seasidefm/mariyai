export enum RewardTier {
    Ineligible,
    Low,
    Medium,
    High,
}

export class BasePromo {
    // Certain things happen at certain tiers for each promotion
    public bitTiers: Map<RewardTier, number> = new Map([
        [RewardTier.Low, 1000],
        [RewardTier.Medium, 2000],
        [RewardTier.High, 5000],
    ])

    public subTiers: Map<RewardTier, number> = new Map([
        [RewardTier.Low, 10],
        [RewardTier.Medium, 20],
        [RewardTier.High, 50],
    ])

    // This will usually correspond to the bit tiers
    public tipTiers: Map<RewardTier, number> = new Map([
        [RewardTier.Low, 10],
        [RewardTier.Medium, 20],
        [RewardTier.High, 50],
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

    public getBitTierThreshold(bitsDonated: number) {
        let closestTier = RewardTier.Ineligible
        for (const [tier, threshold] of this.bitTiers) {
            if (bitsDonated >= threshold) {
                closestTier = tier
                break
            }
        }

        return closestTier
    }

    public getSubTierThreshold(subMonths: number) {
        let closestTier = RewardTier.Ineligible
        for (const [tier, threshold] of this.subTiers) {
            if (subMonths >= threshold) {
                closestTier = tier
                break
            }
        }

        return closestTier
    }

    public getTipTierThreshold(tipAmount: number) {
        let closestTier = RewardTier.Ineligible
        for (const [tier, threshold] of this.tipTiers) {
            if (tipAmount >= threshold) {
                closestTier = tier
                break
            }
        }

        return closestTier
    }
}