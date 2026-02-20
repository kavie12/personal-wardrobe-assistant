import ClothingItem from "./ClothingItem";

class Outfit {
    topwear: Partial<ClothingItem>;
    bottomwear: Partial<ClothingItem>;
    footwear: Partial<ClothingItem>;
    outerwear: Partial<ClothingItem> | null;

    constructor(topwear: Partial<ClothingItem>, bottomwear: Partial<ClothingItem>, footwear: Partial<ClothingItem>, outerwear?: Partial<ClothingItem> | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        if (outerwear) { this.outerwear = outerwear } else { this.outerwear = null };
    }
};

export default Outfit;