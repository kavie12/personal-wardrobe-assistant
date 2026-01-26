import { fetchWardrobe } from '@/api/server';
import { useQuery } from '@tanstack/react-query';

export const useWardrobe = (userId: string) => {
  return useQuery({
    queryKey: ['wardrobe', userId],
    queryFn: () => fetchWardrobe(userId),
    staleTime: Infinity,
    gcTime: Infinity
  });
};