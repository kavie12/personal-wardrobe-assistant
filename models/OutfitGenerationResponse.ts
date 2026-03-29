import OutfitGeneration from "./OutfitGeneration";

class OutfitGenerationResponse {
    id: string;
    outfit: OutfitGeneration;
    reason: string

    constructor(id: string, outfit: OutfitGeneration, reason: string) {
        this.id = id;
        this.outfit = outfit;
        this.reason = reason;
    }
};

export default OutfitGenerationResponse;