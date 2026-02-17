import { ClothingOccasion } from "@/types";

class Schedule {
    dateTime: Date;
    title: string;
    occasion: ClothingOccasion;

    constructor(dateTime: Date, title: string, occasion: ClothingOccasion) {
        this.dateTime = dateTime;
        this.title = title;
        this.occasion = occasion;
    }
};