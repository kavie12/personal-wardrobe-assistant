import ClothingItem from "./ClothingItem";

class OutfitGeneration {
    id?: string;
    topwear: ClothingItem;
    bottomwear: ClothingItem;
    footwear: ClothingItem;
    outerwear: ClothingItem | null;

    constructor(topwear: ClothingItem, bottomwear: ClothingItem, footwear: ClothingItem, outerwear?: ClothingItem | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        if (outerwear) { this.outerwear = outerwear } else { this.outerwear = null };
    }

    setId(id: string) {
        this.id = id;
    }
};

export default OutfitGeneration;