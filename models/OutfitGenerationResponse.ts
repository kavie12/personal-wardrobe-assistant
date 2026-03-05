import Outfit from "./Outfit";

class OutfitGenerationResponse {
    outfit: Outfit;
    reason: string

    constructor(outfit: Outfit, reason: string) {
        this.outfit = outfit;
        this.reason = reason;
    }
};

export default OutfitGenerationResponse;