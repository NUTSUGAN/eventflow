export const EVENT_TIME_ZONE = 'Africa/Lome'

export function eventInputDate(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value) ? `${value}Z` : value)
}

export function formatEventInput(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16)
}
