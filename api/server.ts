import ClothingItem from "@/models/ClothingItem";
import axios from "axios";

const BASE_URL = "http://10.235.135.138:8000";

export const fetchWardrobe = async (userId: string): Promise<ClothingItem[]> => {
    const res = await axios.get(`${BASE_URL}/wardrobe/list/${userId}`);

    return res.data.map((item: any) => 
        new ClothingItem(
            item.id,
            { uri: `data:image/jpeg;base64,${item.image}` },
            item.category,
            item.type,
            item.colors,
            item.occasions,
            item.temperatures
        )
    );
};

export const saveItem = async (itemId: string, userId: string): Promise<boolean> => {
    const res = await axios.post(`${BASE_URL}/wardrobe/save`, {
        item_id: itemId,
        user_id: userId
    });
    return res.data;
};