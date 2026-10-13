import { TrendingKeywordsResponse } from '../types';

export const fetchTrendingFoodKeywords = async (
  refresh = false,
  category = '전체'
): Promise<TrendingKeywordsResponse> => {
  const params = new URLSearchParams();
  if (refresh) params.append('refresh', 'true');
  if (category && category !== '전체') params.append('category', category);

  const res = await fetch(`/api/trending-keywords?${params.toString()}`);
  if (!res.ok) {
    throw new Error('실시간 트렌드 키워드를 불러오지 못했습니다.');
  }
  return await res.json();
};
