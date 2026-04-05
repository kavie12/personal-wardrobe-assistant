import ClothingItem from "./ClothingItem";

class OutfitGeneration {
    topwear: ClothingItem;
    bottomwear: ClothingItem;
    footwear: ClothingItem;
    outerwear: ClothingItem | null;

    constructor(topwear: ClothingItem, bottomwear: ClothingItem, footwear: ClothingItem, outerwear: ClothingItem | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        this.outerwear = outerwear;
    }
};

export default OutfitGeneration;