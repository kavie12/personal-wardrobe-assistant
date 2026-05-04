import { serverApi } from "@/config/serverApi";
import ClothingItem from "@/models/ClothingItem";
import Outfit from "@/models/Outfit";
import OutfitsResponse from "@/models/OutfitsResponse";

const SERVICE = "outfits";

export const saveOutfit = async (outfit: Outfit, occasion: string): Promise<boolean> => {
  const res = await serverApi.post(`${SERVICE}/save`, {
    items: {
      topwear_id: outfit.topwear?.id || null,
      bottomwear_id: outfit.bottomwear?.id || null,
      onepiece_id: outfit.onepiece?.id || null,
      footwear_id: outfit.footwear?.id || null,
      outerwear_id: outfit.outerwear?.id || null,
    },
    occasion: occasion
  });
  return res.data;
};

export const fetchOutfits = async ({ pageParam }: { pageParam: number }): Promise<OutfitsResponse> => {
  
  const res = await serverApi.get(`${SERVICE}/list`, {
    params: {
      page: pageParam,
      size: 10
    }
  });

  return new OutfitsResponse(
    res.data.dataList.map((item: any) => {
      const o = new Outfit (
        item.items.topwear ? new ClothingItem(
          item.items.topwear.id,
          { uri: `data:image/jpeg;base64,${item.items.topwear.image}` },
          item.items.topwear.category,
          item.items.topwear.type,
          item.items.topwear.colors,
          item.items.topwear.occasions,
          item.items.topwear.temperatures
        ) : null,
        item.items.bottomwear ? new ClothingItem(
          item.items.bottomwear.id,
          { uri: `data:image/jpeg;base64,${item.items.bottomwear.image}` },
          item.items.bottomwear.category,
          item.items.bottomwear.type,
          item.items.bottomwear.colors,
          item.items.bottomwear.occasions,
          item.items.bottomwear.temperatures
        ) : null,
        item.items.onepiece ? new ClothingItem(
          item.items.onepiece.id,
          { uri: `data:image/jpeg;base64,${item.items.onepiece.image}` },
          item.items.onepiece.category,
          item.items.onepiece.type,
          item.items.onepiece.colors,
          item.items.onepiece.occasions,
          item.items.onepiece.temperatures
        ) : null,
        item.items.footwear ? new ClothingItem(
            item.items.footwear.id,
            { uri: `data:image/jpeg;base64,${item.items.footwear.image}` },
            item.items.footwear.category,
            item.items.footwear.type,
            item.items.footwear.colors,
            item.items.footwear.occasions,
            item.items.footwear.temperatures
        ) : null,
        item.items.outerwear
          ? new ClothingItem(
              item.items.outerwear.id,
              { uri: `data:image/jpeg;base64,${item.items.outerwear.image}` },
              item.items.outerwear.category,
              item.items.outerwear.type,
              item.items.outerwear.colors,
              item.items.outerwear.occasions,
              item.items.outerwear.temperatures
          )
          : null
      );
      o.setId(item.id);
      o.setOccasion(item.occasion);
      return o;
    }),
    res.data.dataCount,
    res.data.dataCount > pageParam * 10 ? pageParam + 1 : null
  );
};

export const deleteOutfit = async (outfitId: string): Promise<boolean> => {
  const res = await serverApi.delete(`${SERVICE}/delete/${outfitId}`);
  return res.data;
};