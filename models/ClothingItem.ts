import { ClothingCategory, ClothingColor, ClothingOccasion, ClothingTemperature, ClothingType } from "@/types";
import { ImageSourcePropType } from "react-native";

class ClothingItem {
    id: string;
    filename: string;
    image: ImageSourcePropType;
    category: ClothingCategory;
    type: ClothingType;
    colors: ClothingColor[];
    occasions: ClothingOccasion[];
    temperatures: ClothingTemperature[];

    constructor(id: string, filename: string, image: ImageSourcePropType, category: ClothingCategory, type: ClothingType, colors: ClothingColor[], occasions: ClothingOccasion[], temperatures: ClothingTemperature[]) {
        this.id = id;
        this.filename = filename;
        this.image = image;
        this.category = category;
        this.type = type;
        this.colors = colors;
        this.occasions = occasions;
        this.temperatures = temperatures;
    }
}

export default ClothingItem;