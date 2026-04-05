import { WARDROBE_LIST_KEY } from '@/constants/query_keys';
import { fetchWardrobe } from '@/services/wardrobe-service';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useWardrobe = () => {
  const query = useInfiniteQuery({
    queryKey: WARDROBE_LIST_KEY,
    queryFn: fetchWardrobe,
    staleTime: Infinity,
    gcTime: Infinity,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.dataList) || [],
    [query.data]
  );

  return { query, items };
};