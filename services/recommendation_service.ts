import { SAMPLE_USER_ID } from "@/data";
import ClothingItem from "@/models/ClothingItem";
import Outfit from "@/models/Outfit";
import OutfitResponse from "@/models/OutfitResponse";
import axios from "axios";

const BASE_URL = "http://10.225.145.138:8000/recommendation";

export const getRecommendation = async (weatherData: any, occasion: string = "Casual"): Promise<OutfitResponse> => {
    const res = await axios.post(`${BASE_URL}/get-recommendation`, {
        user_id: SAMPLE_USER_ID,
        weather_data: weatherData,
        occasion: occasion
    });

    return new OutfitResponse(
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
};

export const getScheduleRecommendation = async (weatherData: any, scheduleEvent: string): Promise<OutfitResponse> => {
    const res = await axios.post(`${BASE_URL}/get-schedule-recommendation`, {
        user_id: SAMPLE_USER_ID,
        weather_data: weatherData,
        schedule_event: scheduleEvent
    });

    return new OutfitResponse(
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
};