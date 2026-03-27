import { auth } from "@/services/firebase-service";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext<User | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {        
        const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user ?? null));
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={user}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;