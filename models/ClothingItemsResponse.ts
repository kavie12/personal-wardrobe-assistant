import ClothingItem from "./ClothingItem";

class ClothingItemsResponse {
    dataList: ClothingItem[];
    dataCount: number;
    nextPage: number | null;

    constructor(dataList: ClothingItem[], dataCount: number, nextPage: number | null) {
        this.dataList = dataList;
        this.dataCount = dataCount;
        this.nextPage = nextPage;
    }
}

export default ClothingItemsResponse;