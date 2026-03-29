import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from "react";

interface LocationContextValue {
    coords: { lat: number; lng: number } | null;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [location, setLocation] = useState<LocationContextValue | null>(null);

    useEffect(() => {
        async function getCurrentLocation() {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            console.log("Location:", location.coords.latitude, location.coords.longitude);
            setLocation({ coords: { lat: location.coords.latitude, lng: location.coords.longitude } });
        }
        getCurrentLocation();
    }, []);

    return <LocationContext.Provider value={location}>{children}</LocationContext.Provider>;
};

export const useLocation = (): LocationContextValue => {
    const context = useContext(LocationContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }

    return context;
};