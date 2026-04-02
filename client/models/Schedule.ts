import { ClothingOccasion } from "@/types";

class Schedule {
    id?: string
    title: string;
    occasion: ClothingOccasion;
    timestamp: Date;

    constructor(id: string | undefined, title: string, occasion: ClothingOccasion, date: Date, time?: Date);
    constructor(id: string | undefined, title: string, occasion: ClothingOccasion, timestamp: Date);

    constructor(id: string | undefined, title: string, occasion: ClothingOccasion, dateOrTimestamp: Date, time?: Date) {
        if (id) this.id = id;

        this.title = title;
        this.occasion = occasion;

        if (time) {
            this.timestamp = new Date(
                dateOrTimestamp.getFullYear(),
                dateOrTimestamp.getMonth(),
                dateOrTimestamp.getDate(),
                time.getHours(),
                time.getMinutes()
            );
        } else {
            this.timestamp = dateOrTimestamp;
        }
    }
    
};

export default Schedule;