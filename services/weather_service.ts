import Weather from "@/models/Weather";
import { titleCase } from "@/utils";
import axios from "axios";

export const getCurrentWeather = async (lat: number, lon: number): Promise<Weather | null> => {
    try {
        // Fetch weather data
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.EXPO_PUBLIC_OPEN_WEATHER_API_KEY}&units=metric`);
        
        // Fetch weather icon
        const img = await axios.get(`https://openweathermap.org/payload/api/media/file/${res.data.weather[0].icon}.png`, {
            responseType: "arraybuffer"
        });

        // Convert weather icon to base64
        const base64 = btoa(
            new Uint8Array(img.data).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        );
        
        return new Weather(
            Math.round(res.data.main.temp),
            titleCase(res.data.weather[0].description),
            `data:image/jpeg;base64,${base64}`
        );
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getForecastWeather = async (lat: number, lon: number, targetDate: Date): Promise<Weather | null> => {    
    try {
        // Calculate the number of days from today to the target date
        const daysDiff = Math.floor(
            (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const cnt = daysDiff + 1; // today=1, tomorrow=2, etc.

        // Fetch weather data
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=${cnt}&appid=${process.env.EXPO_PUBLIC_OPEN_WEATHER_API_KEY}&units=metric`);
        
        // pick the right day
        const forecastData = res.data.list[daysDiff];

        // Fetch weather icon
        const img = await axios.get(`https://openweathermap.org/payload/api/media/file/${forecastData.weather[0].icon}.png`, {
            responseType: "arraybuffer"
        });

        // Convert weather icon to base64
        const base64 = btoa(
            new Uint8Array(img.data).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        );

        // Filter out the right temperature based on the time of the target date
        const hour = targetDate.getHours();
        let selectedTemp: number;

        if (hour >= 6 && hour < 12) {
            selectedTemp = forecastData.temp.morn;   // morning
        } else if (hour >= 12 && hour < 18) {
            selectedTemp = forecastData.temp.day;    // daytime
        } else if (hour >= 18 && hour < 21) {
            selectedTemp = forecastData.temp.eve;    // evening
        } else {
            selectedTemp = forecastData.temp.night;  // night
        }

        // Return the weather object
        return new Weather(
            Math.round(selectedTemp),
            titleCase(forecastData.weather[0].description),
            `data:image/jpeg;base64,${base64}`
        );
    } catch (error) {
        console.error(error);
        return null;
    }
};