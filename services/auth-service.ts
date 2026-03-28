import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

export const register = async (email: string, password: string): Promise<void> => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Register error", errorCode, errorMessage);
    }
};

export const login = async (email: string, password: string): Promise<void> => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Login error", errorCode, errorMessage);
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Logout error", errorCode, errorMessage);
    }
};

// export const changePassword = async (user: User, newPassword: string): Promise<void> => {
//     try {
//         await updatePassword(user, newPassword);
//     } catch (err: any) {
//         const errorCode = err.code;
//         const errorMessage = err.message;
//         console.log("Change password error", errorCode, errorMessage);
//     }
// };