import ClothingItem from "./ClothingItem";

class OutfitGeneration {
    topwear: ClothingItem | null;
    bottomwear: ClothingItem | null;
    footwear: ClothingItem | null;
    outerwear: ClothingItem | null;

    constructor(topwear: ClothingItem | null, bottomwear: ClothingItem | null, footwear: ClothingItem | null, outerwear: ClothingItem | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        this.outerwear = outerwear;
    }
};

export default OutfitGeneration;