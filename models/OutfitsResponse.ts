import Outfit from "./Outfit";

class OutfitsResponse {
    dataList: Outfit[];
    dataCount: number;
    nextPage: number | null;

    constructor(dataList: Outfit[], dataCount: number, nextPage: number | null) {
        this.dataList = dataList;
        this.dataCount = dataCount;
        this.nextPage = nextPage;
    }
};

export default OutfitsResponse;