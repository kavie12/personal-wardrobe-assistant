import { serverApi } from "@/config/serverApi";
import ClothingItem from "@/models/ClothingItem";
import OutfitGeneration from "@/models/OutfitGeneration";
import OutfitGenerationResponse from "@/models/OutfitGenerationResponse";
import { SlotHints } from "@/types";

const SERVICE = "recommendation";

export const getRecommendation = async (
    temperature: number,
    occasion: string,
    type: SlotHints | null = null,
    color: SlotHints | null = null
): Promise<OutfitGenerationResponse> => {
    try {
        const res = await serverApi.post(`${SERVICE}/get-recommendation`, {
            temperature,
            occasion,
            type,
            color
        });

        return new OutfitGenerationResponse(
            res.data.id,
            new OutfitGeneration (
                res.data.outfit.topwear ? new ClothingItem(
                    res.data.outfit.topwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.topwear.image}` },
                    res.data.outfit.topwear.category,
                    res.data.outfit.topwear.type,
                    res.data.outfit.topwear.colors,
                    res.data.outfit.topwear.occasions,
                    res.data.outfit.topwear.temperatures
                ) : null,
                res.data.outfit.bottomwear ? new ClothingItem(
                    res.data.outfit.bottomwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.bottomwear.image}` },
                    res.data.outfit.bottomwear.category,
                    res.data.outfit.bottomwear.type,
                    res.data.outfit.bottomwear.colors,
                    res.data.outfit.bottomwear.occasions,
                    res.data.outfit.bottomwear.temperatures
                ) : null,
                res.data.outfit.footwear ? new ClothingItem(
                    res.data.outfit.footwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.footwear.image}` },
                    res.data.outfit.footwear.category,
                    res.data.outfit.footwear.type,
                    res.data.outfit.footwear.colors,
                    res.data.outfit.footwear.occasions,
                    res.data.outfit.footwear.temperatures
                ) : null,
                res.data.outfit.outerwear ? new ClothingItem(
                    res.data.outfit.outerwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.outerwear.image}` },
                    res.data.outfit.outerwear.category,
                    res.data.outfit.outerwear.type,
                    res.data.outfit.outerwear.colors,
                    res.data.outfit.outerwear.occasions,
                    res.data.outfit.outerwear.temperatures
                ) : null
            ),
            res.data.reason
        );
    } catch (error) {
        console.error("Error fetching recommendation:", error);
        throw error;
    }
};