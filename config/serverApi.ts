import axios from "axios";
import { auth } from "./firebase";

export const serverApi = axios.create({
    baseURL: "http://10.225.145.138:8000/api/v1"
});

serverApi.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();;
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});