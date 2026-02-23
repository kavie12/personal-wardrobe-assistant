import { WARDROBE_LIST_KEY } from '@/constants/query_keys';
import { fetchWardrobe } from '@/services/wardrobe_service';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useWardrobe = () => {
  const query = useInfiniteQuery({
    queryKey: WARDROBE_LIST_KEY,
    queryFn: fetchWardrobe,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.dataList) || [],
    [query.data]
  );

  return { query, items };
};