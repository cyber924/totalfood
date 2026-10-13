import { PresetSample } from '../types';

export const SAMPLE_PRESETS: PresetSample[] = [
  {
    id: 'seongsu_gamjatang',
    title: '성수동 감자탕 맛집',
    badge: '🔥 핫플 웨이팅',
    input: {
      restaurantName: '소문난 성수 감자탕',
      location: '서울 성동구 연무장길 (성수역 4번 출구 200m)',
      menuItems: '우거지 감자탕(중), 수제비 사리 추가, 볶음밥',
      features: '백종원의 3대천왕 출연, 푸짐한 등뼈와 진한 국물, 24시간 영업, 웨이팅 필수',
      tone: 'power_blogger',
      blogType: 'naver',
    },
  },
  {
    id: 'yeonnam_cafe',
    title: '연남동 감성 디저트 카페',
    badge: '☕ 데이트 코스',
    input: {
      restaurantName: '카페 버터밀크 연남',
      location: '서울 마포구 연남동 경의선 숲길 근처',
      menuItems: '수제 팬케이크 세트, 아이스 아인슈페너, 자몽 에이드',
      features: '유럽 빈티지 인테리어, 창가 햇살 맛집, 디저트 당일 한정 수량, 인스타 감성 사진 잘 나옴',
      tone: 'romantic_date',
      blogType: 'naver',
    },
  },
  {
    id: 'jeju_blackpig',
    title: '제주 애월 흑돼지 전문점',
    badge: '🥩 내돈내산 강추',
    input: {
      restaurantName: '애월 솔향 흑돼지 구이',
      location: '제주 제주시 애월읍 해안도로변',
      menuItems: '숙성 흑돼지 근고기(600g), 멜젓, 칠돈 해물 된장찌개',
      features: '애월 바다 오션뷰 보며 식사, 육즙 가득 구워주는 서비스, 참숯 향 가득, 주차장 매우 넓음',
      tone: 'honest_review',
      blogType: 'naver',
    },
  },
  {
    id: 'gangnam_pasta',
    title: '강남역 생면 파스타 레스토랑',
    badge: '🍷 분위기 미식',
    input: {
      restaurantName: '비스트로 로제 강남점',
      location: '서울 강남구 역삼동 (강남역 11번 출구 도보 3분)',
      menuItems: '트러플 크림 생면 파스타, 수제 트러플 뇨끼, 하우스 와인',
      features: '자가제면 자색 생면 사용, 조명 은은하고 소개팅 장소로 유명, 예약 필수',
      tone: 'gourmet_critic',
      blogType: 'tistory',
    },
  },
];
