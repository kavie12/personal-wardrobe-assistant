import { SAMPLE_USER_ID } from "@/data";
import ClothingItem from "@/models/ClothingItem";
import ClothingItemsResponse from "@/models/ClothingItemsResponse";
import axios from "axios";

const BASE_URL = "http://10.225.145.138:8000/wardrobe";

export const addItem = async (imageUri: string): Promise<ClothingItem> => {
    const formData = new FormData();
            
    formData.append("clothing_item", {
        uri: imageUri,
        name: "upload.jpg",
        type: "image/jpeg"
    } as any);

    const res = await axios.post(`${BASE_URL}/add`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return new ClothingItem(
        res.data.id,
        { uri: imageUri },
        res.data.category,
        res.data.type,
        res.data.colors,
        res.data.occasions,
        res.data.temperatures
    );
};

export const fetchWardrobe = async ({ pageParam }: { pageParam: number }): Promise<ClothingItemsResponse> => {
    const res = await axios.get(`${BASE_URL}/list/${SAMPLE_USER_ID}`, {
        params: {
            page: pageParam,
            size: 10
        }
    });

    return new ClothingItemsResponse(
        res.data.dataList.map((item: any) => 
            new ClothingItem(
                item.id,
                { uri: `data:image/jpeg;base64,${item.image}` },
                item.category,
                item.type,
                item.colors,
                item.occasions,
                item.temperatures
            )
        ),
        res.data.dataCount,
        res.data.dataCount > pageParam * 10 ? pageParam + 1 : null
    );
};

export const saveItem = async (item: ClothingItem, userId: string): Promise<boolean> => {
    const res = await axios.post(`${BASE_URL}/save`, {
        item_id: item.id,
        user_id: userId,
        labels: {
            category: item.category,
            type: item.type,
            colors: item.colors,
            occasions: item.occasions,
            temperatures: item.temperatures,
        }
    });
    return res.data;
};

export const updateItem = async (item: ClothingItem): Promise<boolean> => {
    const res = await axios.put(`${BASE_URL}/update/${item.id}`, {
        labels: {
            category: item.category,
            type: item.type,
            colors: item.colors,
            occasions: item.occasions,
            temperatures: item.temperatures
        }
    });
    return res.data;
};

export const deleteItem = async (itemId: string): Promise<boolean> => {
    const res = await axios.delete(`${BASE_URL}/delete/${itemId}`);
    return res.data;
};