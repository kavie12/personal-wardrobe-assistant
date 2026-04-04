import { ClothingOccasion } from "@/types";
import ClothingItem from "./ClothingItem";

class Outfit {
    id?: string;
    topwear: ClothingItem | null;
    bottomwear: ClothingItem | null;
    footwear: ClothingItem | null;
    outerwear: ClothingItem | null;
    occasion?: ClothingOccasion;

    constructor(topwear: ClothingItem | null, bottomwear: ClothingItem | null, footwear: ClothingItem | null, outerwear: ClothingItem | null) {
        this.topwear = topwear;
        this.bottomwear = bottomwear;
        this.footwear = footwear;
        this.outerwear = outerwear;
    }

    setId(id: string) {
        this.id = id;
    }

    setOccasion(occasion: ClothingOccasion) {
        this.occasion = occasion;
    }
};

export default Outfit;