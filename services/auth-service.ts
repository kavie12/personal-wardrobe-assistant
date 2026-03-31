import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, updateProfile } from "firebase/auth";

export const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredentials.user, { displayName: name });
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

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
        await reauthenticateWithCredential(auth.currentUser!, EmailAuthProvider.credential(auth.currentUser?.email!, currentPassword));
        await updatePassword(auth.currentUser!, newPassword);
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Change password error", errorCode, errorMessage);
    }
};

export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Reset password error", errorCode, errorMessage);
    }
};

export const deleteAccount = async (password: string): Promise<void> => {
    try {
        await reauthenticateWithCredential(auth.currentUser!, EmailAuthProvider.credential(auth.currentUser?.email!, password));
        await deleteUser(auth.currentUser!);
        // TODO: Wipe out all user's data
    } catch (err: any) {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.log("Delete user error", errorCode, errorMessage);
    }
};