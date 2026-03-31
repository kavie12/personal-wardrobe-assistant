import axios from "axios";
import { auth } from "./firebase";

export const serverApi = axios.create({
    baseURL: `${process.env.EXPO_PUBLIC_SERVER_API_URL}/api/v1`
});

serverApi.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        // Wait for auth state to resolve
        const token = await new Promise<string | null>((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                unsubscribe();
                if (user) {
                    resolve(await user.getIdToken());
                } else {
                    resolve(null);
                }
            });
        });
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});