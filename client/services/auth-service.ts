import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, updateProfile } from "firebase/auth";

export const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredentials.user, { displayName: name });
    } catch (err: any) {
        throw new Error(mapAuthCodeToMessage(err.code));
    }
};

export const login = async (email: string, password: string): Promise<void> => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
        throw new Error(mapAuthCodeToMessage(err.code));
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (err: any) {
        throw new Error(mapAuthCodeToMessage(err.code));
    }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
        await reauthenticateWithCredential(auth.currentUser!, EmailAuthProvider.credential(auth.currentUser?.email!, currentPassword));
        await updatePassword(auth.currentUser!, newPassword);
    } catch (err: any) {
        throw new Error(mapAuthCodeToMessage(err.code));
    }
};

export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
        throw new Error(mapAuthCodeToMessage(err.code));
    }
};

export const deleteAccount = async (password: string): Promise<void> => {
    try {
        await reauthenticateWithCredential(auth.currentUser!, EmailAuthProvider.credential(auth.currentUser?.email!, password));
        await deleteUser(auth.currentUser!);
        // TODO: Wipe out all user's data
    } catch (err: any) {
        throw new Error(mapAuthCodeToMessage(err.code));
    }
};

const mapAuthCodeToMessage = (code: string): string => {
    switch (code) {
        case "auth/invalid-email":
            return "That email address is not valid.";
        case "auth/user-disabled":
            return "This user has been disabled.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Invalid email or password.";
        case "auth/email-already-in-use":
            return "An account already exists with this email.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        case "auth/requires-recent-login":
            return "Please log out and log back in before attempting this action.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
};