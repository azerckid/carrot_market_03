export function formatToTimeAgo(date: string | Date | number): string {
  const dayInMs = 1000 * 60 * 60 * 24;
  
  // Date 객체, 숫자(타임스탬프), 문자열 모두 처리
  let time: number;
  if (date instanceof Date) {
    time = date.getTime();
  } else if (typeof date === "number") {
    time = date;
  } else {
    time = new Date(date).getTime();
  }
  
  // 유효하지 않은 날짜인 경우 체크
  if (!isFinite(time)) {
    return "알 수 없음";
  }
  
  const now = new Date().getTime();
  const diff = Math.round((time - now) / dayInMs);
  
  // diff가 유한한 숫자인지 확인
  if (!isFinite(diff)) {
    return "알 수 없음";
  }

  const formatter = new Intl.RelativeTimeFormat("ko");

  return formatter.format(diff, "days");
}

export function formatToWon(price: number): string {
  return price.toLocaleString("ko-KR");
}

