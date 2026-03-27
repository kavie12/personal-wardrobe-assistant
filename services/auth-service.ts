import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, User } from "firebase/auth";
import { auth } from "./firebase-service";

export const register = async (email: string, password: string): Promise<boolean> => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        return true;
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Register error", errorCode, errorMessage);
        return false;
    }
};

export const login = async (email: string, password: string): Promise<boolean> => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Login error", errorCode, errorMessage);
        return false;
    }
};

export const logout = async (): Promise<boolean> => {
    try {
        await signOut(auth);
        return true;
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Logout error", errorCode, errorMessage);
        return false;
    }
};

export const changePassword = async (user: User, newPassword: string): Promise<boolean> => {
    try {
        await updatePassword(user, newPassword);
        return true;
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Change password error", errorCode, errorMessage);
        return false;
    }
};