import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from "react";

interface LocationContextValue {
    coords: { lat: number; lng: number } | null;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (coords) return;

        async function getCurrentLocation() {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permission to access location was denied');
            }
            let location = await Location.getCurrentPositionAsync({});
            console.log("Location:", location.coords.latitude, location.coords.longitude);
            setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
        }
        getCurrentLocation();
    }, []);

    return <LocationContext.Provider value={{ coords }}>{children}</LocationContext.Provider>;
};

export const useLocation = (): LocationContextValue => {
    const context = useContext(LocationContext);

    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider.");
    }

    return context;
};