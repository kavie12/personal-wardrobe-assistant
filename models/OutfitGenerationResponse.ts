import Outfit from "./Outfit";

class OutfitGenerationResponse {
    id: string;
    outfit: Outfit;
    reason: string

    constructor(id: string, outfit: Outfit, reason: string) {
        this.id = id;
        this.outfit = outfit;
        this.reason = reason;
    }
};

export default OutfitGenerationResponse;