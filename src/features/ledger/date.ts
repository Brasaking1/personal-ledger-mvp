const pad = (value: number) => String(value).padStart(2, '0');

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function currentDayRange(now = new Date()) {
  const today = toDateInputValue(now);
  return {
    start: today,
    end: today
  };
}

export function currentWeekRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(now)
  };
}

export function currentMonthRange(now = new Date()) {
  return {
    start: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toDateInputValue(now)
  };
}
