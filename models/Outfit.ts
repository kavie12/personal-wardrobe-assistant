import ClothingItem from "./ClothingItem";

class Outfit {
    topwear: Partial<ClothingItem>;
    bottomwear: Partial<ClothingItem>;
    footwear: Partial<ClothingItem>;

    constructor(topwear: Partial<ClothingItem>, bottomwear: Partial<ClothingItem>, footwear: Partial<ClothingItem>) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
    }
}

export default Outfit;