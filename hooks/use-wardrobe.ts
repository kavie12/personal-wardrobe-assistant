import ClothingItem from '@/models/ClothingItem';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useWardrobe = (userId: string) => {
  return useQuery({
    queryKey: ['wardrobe', userId],
    queryFn: async () => {
        const res = await axios.get(`http://10.235.135.138:8000/wardrobe/list/${userId}`);

        return res.data.map((item: any) => 
            new ClothingItem(
                item.id,
                { uri: `data:image/jpeg;base64,${item.image}` },
                item.category,
                item.type,
                item.colors,
                item.occasions,
                item.temperatures
            )
        );
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
};