import { ChristmasPromo } from './christmas.ts'
import { GenericPromo } from './generic.ts'

const promotions = [new GenericPromo(), new ChristmasPromo()]

export const getActivePromotions = () => {
    return promotions.filter((promo) => promo.getActive())
}
