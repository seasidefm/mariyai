import { ChristmasPromo } from './christmas.ts'

const promotions = [new ChristmasPromo()]

export const getActivePromotions = () => {
    return promotions.filter((promo) => promo.getActive())
}
