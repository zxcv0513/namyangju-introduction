// 지도 검색 링크 (DESIGN.md 4장). URL 형식은 4단계에서 실제로 열어 확인한다.

const query = (name: string) => encodeURIComponent(`남양주 ${name}`);

export const naverMapUrl = (name: string) => `https://map.naver.com/p/search/${query(name)}`;

export const kakaoMapUrl = (name: string) => `https://map.kakao.com/?q=${query(name)}`;
