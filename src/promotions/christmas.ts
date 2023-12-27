import { BasePromo } from './base.ts'

export class ChristmasPromo extends BasePromo {
    public getPromo() {
        return 'ChristmasPromo'
    }

    public getActive() {
        // Active in December, before the 26th
        const now = new Date()
        const month = now.getMonth()
        const day = now.getDate()

        return month === 11
    }
}
