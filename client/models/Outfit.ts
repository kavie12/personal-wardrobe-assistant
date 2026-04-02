import { ClothingOccasion } from "@/types";
import ClothingItem from "./ClothingItem";

class Outfit {
    id?: string;
    topwear: ClothingItem;
    bottomwear: ClothingItem;
    footwear: ClothingItem;
    outerwear: ClothingItem | null;
    occasion?: ClothingOccasion;

    constructor(topwear: ClothingItem, bottomwear: ClothingItem, footwear: ClothingItem, outerwear?: ClothingItem | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        if (outerwear) { this.outerwear = outerwear } else { this.outerwear = null };
    }

    setId(id: string) {
        this.id = id;
    }

    setOccasion(occasion: ClothingOccasion) {
        this.occasion = occasion;
    }
};

export default Outfit;