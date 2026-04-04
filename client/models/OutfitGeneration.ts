import ClothingItem from "./ClothingItem";

class OutfitGeneration {
    id?: string;
    topwear: ClothingItem;
    bottomwear: ClothingItem;
    footwear: ClothingItem;
    outerwear: ClothingItem | null;
    accepted?: boolean;

    constructor(topwear: ClothingItem, bottomwear: ClothingItem, footwear: ClothingItem, outerwear?: ClothingItem | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        if (outerwear) { this.outerwear = outerwear } else { this.outerwear = null };
    }

    setId(id: string) {
        this.id = id;
    }

    setAccepted(accepted: boolean) {
        this.accepted = accepted;
    }
};

export default OutfitGeneration;