import { serverApi } from "@/config/serverApi";
import ClothingItem from "@/models/ClothingItem";
import Outfit from "@/models/Outfit";
import OutfitGenerationResponse from "@/models/OutfitGenerationResponse";

const SERVICE = "recommendation";

export const getRecommendation = async (weatherData: { temperature: number, description: string }, occasion: string): Promise<OutfitGenerationResponse> => {
    try {
        const res = await serverApi.post(`${SERVICE}/get-recommendation`, {
            weather_data: weatherData,
            occasion: occasion
        });

        return new OutfitGenerationResponse(
            res.data.id,
            new Outfit (
                new ClothingItem(
                    res.data.outfit.topwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.topwear.image}` },
                    res.data.outfit.topwear.category,
                    res.data.outfit.topwear.type,
                    res.data.outfit.topwear.colors,
                    res.data.outfit.topwear.occasions,
                    res.data.outfit.topwear.temperatures
                ),
                new ClothingItem(
                    res.data.outfit.bottomwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.bottomwear.image}` },
                    res.data.outfit.bottomwear.category,
                    res.data.outfit.bottomwear.type,
                    res.data.outfit.bottomwear.colors,
                    res.data.outfit.bottomwear.occasions,
                    res.data.outfit.bottomwear.temperatures
                ),
                new ClothingItem(
                    res.data.outfit.footwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.footwear.image}` },
                    res.data.outfit.footwear.category,
                    res.data.outfit.footwear.type,
                    res.data.outfit.footwear.colors,
                    res.data.outfit.footwear.occasions,
                    res.data.outfit.footwear.temperatures
                ),
                res.data.outfit.outerwear
                    ? new ClothingItem(
                        res.data.outfit.outerwear.id,
                        { uri: `data:image/jpeg;base64,${res.data.outfit.outerwear.image}` },
                        res.data.outfit.outerwear.category,
                        res.data.outfit.outerwear.type,
                        res.data.outfit.outerwear.colors,
                        res.data.outfit.outerwear.occasions,
                        res.data.outfit.outerwear.temperatures
                    )
                    : null
            ),
            res.data.reason
        );
    } catch (error) {
        console.error("Error fetching recommendation:", error);
        throw error;
    }
};

export const getScheduleRecommendation = async (weatherData: { temperature: number, description: string }, scheduleEvent: string): Promise<OutfitGenerationResponse> => {
    try {
        const res = await serverApi.post(`${SERVICE}/get-schedule-recommendation`, {
            weather_data: weatherData,
            schedule_event: scheduleEvent
        });

        return new OutfitGenerationResponse(
            res.data.id,
            new Outfit (
                new ClothingItem(
                    res.data.outfit.topwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.topwear.image}` },
                    res.data.outfit.topwear.category,
                    res.data.outfit.topwear.type,
                    res.data.outfit.topwear.colors,
                    res.data.outfit.topwear.occasions,
                    res.data.outfit.topwear.temperatures
                ),
                new ClothingItem(
                    res.data.outfit.bottomwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.bottomwear.image}` },
                    res.data.outfit.bottomwear.category,
                    res.data.outfit.bottomwear.type,
                    res.data.outfit.bottomwear.colors,
                    res.data.outfit.bottomwear.occasions,
                    res.data.outfit.bottomwear.temperatures
                ),
                new ClothingItem(
                    res.data.outfit.footwear.id,
                    { uri: `data:image/jpeg;base64,${res.data.outfit.footwear.image}` },
                    res.data.outfit.footwear.category,
                    res.data.outfit.footwear.type,
                    res.data.outfit.footwear.colors,
                    res.data.outfit.footwear.occasions,
                    res.data.outfit.footwear.temperatures
                ),
                res.data.outfit.outerwear
                    ? new ClothingItem(
                        res.data.outfit.outerwear.id,
                        { uri: `data:image/jpeg;base64,${res.data.outfit.outerwear.image}` },
                        res.data.outfit.outerwear.category,
                        res.data.outfit.outerwear.type,
                        res.data.outfit.outerwear.colors,
                        res.data.outfit.outerwear.occasions,
                        res.data.outfit.outerwear.temperatures
                    )
                    : null
            ),
            res.data.reason
        );
    } catch (error) {
        console.error("Error fetching schedule recommendation:", error);
        throw error;
    }
};

export const acceptOutfit = async (id: string): Promise<void> => {
    try {
        await serverApi.post(`${SERVICE}/accept-outfit`, {
            outfit_id: id
        });
    } catch (error) {
        console.error("Error accepting outfit:", error);
    }
};

export const rejectOutfit = async (id: string): Promise<void> => {
    try {
        await serverApi.post(`${SERVICE}/reject-outfit`, {
            outfit_id: id
        });
    } catch (error) {
        console.error("Error rejecting outfit:", error);
    }
};