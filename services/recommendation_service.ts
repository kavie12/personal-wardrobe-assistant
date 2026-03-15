import { SAMPLE_USER_ID } from "@/data";
import ClothingItem from "@/models/ClothingItem";
import Outfit from "@/models/Outfit";
import OutfitGenerationResponse from "@/models/OutfitGenerationResponse";
import axios from "axios";

const BASE_URL = "http://10.225.145.138:8000/recommendation";

// Helper to convert Outfit to API format
function outfitToApiFormat(outfit: Outfit) {
    return {
        topwear: {
            id: outfit.topwear.id,
            category: outfit.topwear.category,
            type: outfit.topwear.type,
            colors: outfit.topwear.colors,
            occasions: outfit.topwear.occasions,
            temperatures: outfit.topwear.temperatures
        },
        bottomwear: {
            id: outfit.bottomwear.id,
            category: outfit.bottomwear.category,
            type: outfit.bottomwear.type,
            colors: outfit.bottomwear.colors,
            occasions: outfit.bottomwear.occasions,
            temperatures: outfit.bottomwear.temperatures
        },
        footwear: {
            id: outfit.footwear.id,
            category: outfit.footwear.category,
            type: outfit.footwear.type,
            colors: outfit.footwear.colors,
            occasions: outfit.footwear.occasions,
            temperatures: outfit.footwear.temperatures
        },
        outerwear: outfit.outerwear ? {
            id: outfit.outerwear.id,
            category: outfit.outerwear.category,
            type: outfit.outerwear.type,
            colors: outfit.outerwear.colors,
            occasions: outfit.outerwear.occasions,
            temperatures: outfit.outerwear.temperatures
        } : null
    };
}

// Helper to safely convert outfit (handles both plain objects and class instances)
function safeOutfitToApiFormat(outfit: any) {
    // If it's already in the right format (plain object from backend), return as is
    if (outfit.topwear && typeof outfit.topwear === 'object' && 'id' in outfit.topwear) {
        return {
            topwear: {
                id: outfit.topwear.id,
                category: outfit.topwear.category,
                type: outfit.topwear.type,
                colors: outfit.topwear.colors || [],
                occasions: outfit.topwear.occasions || [],
                temperatures: outfit.topwear.temperatures || []
            },
            bottomwear: {
                id: outfit.bottomwear.id,
                category: outfit.bottomwear.category,
                type: outfit.bottomwear.type,
                colors: outfit.bottomwear.colors || [],
                occasions: outfit.bottomwear.occasions || [],
                temperatures: outfit.bottomwear.temperatures || []
            },
            footwear: {
                id: outfit.footwear.id,
                category: outfit.footwear.category,
                type: outfit.footwear.type,
                colors: outfit.footwear.colors || [],
                occasions: outfit.footwear.occasions || [],
                temperatures: outfit.footwear.temperatures || []
            },
            outerwear: outfit.outerwear ? {
                id: outfit.outerwear.id,
                category: outfit.outerwear.category,
                type: outfit.outerwear.type,
                colors: outfit.outerwear.colors || [],
                occasions: outfit.outerwear.occasions || [],
                temperatures: outfit.outerwear.temperatures || []
            } : null
        };
    }
    
    // Otherwise assume it's a class instance
    return outfitToApiFormat(outfit);
}

export const getRecommendation = async (
    weatherData: { temperature: number; description: string },
    occasion: string = "Casual",
    isRetry: boolean = false
): Promise<OutfitGenerationResponse> => {
    try {
        const res = await axios.post(`${BASE_URL}/get-recommendation`, {
            user_id: SAMPLE_USER_ID,
            weather_data: weatherData,
            occasion: occasion,
            is_retry: isRetry
        });

        return parseOutfitResponse(res.data);
    } catch (error) {
        console.error("Error fetching recommendation:", error);
        throw error;
    }
};

export const getScheduleRecommendation = async (
    weatherData: { temperature: number; description: string },
    scheduleEvent: string,
    isRetry: boolean = false
): Promise<OutfitGenerationResponse> => {
    try {
        const res = await axios.post(`${BASE_URL}/get-schedule-recommendation`, {
            user_id: SAMPLE_USER_ID,
            weather_data: weatherData,
            schedule_event: scheduleEvent,
            is_retry: isRetry
        });

        return parseOutfitResponse(res.data);
    } catch (error) {
        console.error("Error fetching schedule recommendation:", error);
        throw error;
    }
};

export const recordRejection = async (
    weatherData: { temperature: number; description: string },
    context: string,
    outfit: Outfit,
    reason: string = ""
): Promise<void> => {
    try {
        await axios.post(`${BASE_URL}/record-rejection`, {
            user_id: SAMPLE_USER_ID,
            weather_data: weatherData,
            context: context,
            outfit_items: safeOutfitToApiFormat(outfit),
            reason: reason
        });
    } catch (error) {
        console.error("Error recording rejection:", error);
    }
};

export const acceptOutfit = async (
    weatherData: { temperature: number; description: string },
    context: string, // occasion or schedule event
    outfit: Outfit,
    reason: string = ""
): Promise<{ status: string; message: string }> => {
    try {
        const res = await axios.post(`${BASE_URL}/accept-outfit`, {
            user_id: SAMPLE_USER_ID,
            weather_data: weatherData,
            context: context,
            outfit_items: safeOutfitToApiFormat(outfit),
            reason: reason
        });

        return res.data;
    } catch (error) {
        console.error("Error accepting outfit:", error);
        throw error;
    }
};

export const clearRetryCache = async (
    weatherData: { temperature: number; description: string },
    context: string
): Promise<{ status: string; message: string }> => {
    try {
        const res = await axios.post(`${BASE_URL}/clear-retry-cache`, {
            user_id: SAMPLE_USER_ID,
            weather_data: weatherData,
            context: context
        });

        return res.data;
    } catch (error) {
        console.error("Error clearing retry cache:", error);
        throw error;
    }
};

function parseOutfitResponse(data: any): OutfitGenerationResponse {
    return new OutfitGenerationResponse(
        new Outfit(
            new ClothingItem(
                data.outfit.topwear.id,
                { uri: `data:image/jpeg;base64,${data.outfit.topwear.image}` },
                data.outfit.topwear.category,
                data.outfit.topwear.type,
                data.outfit.topwear.colors,
                data.outfit.topwear.occasions,
                data.outfit.topwear.temperatures
            ),
            new ClothingItem(
                data.outfit.bottomwear.id,
                { uri: `data:image/jpeg;base64,${data.outfit.bottomwear.image}` },
                data.outfit.bottomwear.category,
                data.outfit.bottomwear.type,
                data.outfit.bottomwear.colors,
                data.outfit.bottomwear.occasions,
                data.outfit.bottomwear.temperatures
            ),
            new ClothingItem(
                data.outfit.footwear.id,
                { uri: `data:image/jpeg;base64,${data.outfit.footwear.image}` },
                data.outfit.footwear.category,
                data.outfit.footwear.type,
                data.outfit.footwear.colors,
                data.outfit.footwear.occasions,
                data.outfit.footwear.temperatures
            ),
            data.outfit.outerwear
                ? new ClothingItem(
                    data.outfit.outerwear.id,
                    { uri: `data:image/jpeg;base64,${data.outfit.outerwear.image}` },
                    data.outfit.outerwear.category,
                    data.outfit.outerwear.type,
                    data.outfit.outerwear.colors,
                    data.outfit.outerwear.occasions,
                    data.outfit.outerwear.temperatures
                )
                : null
        ),
        data.reason
    );
}