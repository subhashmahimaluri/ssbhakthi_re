import { format } from 'date-fns';

export const formatTimeIST = (value: Date | string | undefined): string => {
  if (!value) return 'N/A';

  const date = new Date(value);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

export const formatToDateTimeIST = (date: Date | string): string => {
  const inputDate = new Date(date);
  return inputDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const startEndDateFormat = (start: Date | string, end: Date | string): string => {
  return `${formatToDateTimeIST(start)} – ${formatToDateTimeIST(end)}`;
};

export const formatFullDateWithWeekday = (date: Date | string): string => {
  const inputDate = new Date(date);
  return inputDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

export const formatFullDate = (date: Date | string): string => {
  const inputDate = new Date(date);
  return inputDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

export const formatMonth = (date: Date | string): string => {
  const inputDate = new Date(date);
  return inputDate
    .toLocaleString('en-US', {
      month: 'long',
    })
    .toLowerCase();
};

export const formatDay = (date: Date | string): string => {
  const inputDate = new Date(date);
  return inputDate.toLocaleString('en-US', {
    day: '2-digit',
  });
};

const monthOrder = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function groupTithiByMonth(tithiResults: any[]): { month: string; tithiData: any[] }[] {
  const monthMap: Record<string, { month: string; tithiData: any[] }> = {};

  for (const item of tithiResults) {
    const startDate = new Date(item.tithi.start);
    const monthName = format(startDate, 'LLLL'); // e.g., 'January'

    if (!monthMap[monthName]) {
      monthMap[monthName] = {
        month: monthName,
        tithiData: [],
      };
    }

    monthMap[monthName].tithiData.push(item);
  }

  // Sort tithiData within each month
  Object.values(monthMap).forEach(monthGroup => {
    monthGroup.tithiData.sort((a, b) => {
      const dateA = new Date(a.tithi.start).getTime();
      const dateB = new Date(b.tithi.start).getTime();
      return dateA - dateB;
    });
  });

  // Return months in correct order
  return Object.values(monthMap).sort(
    (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

export const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function interpolate(
  template: string | undefined | null,
  variables: Record<string, string | number | undefined | null> = {}
): string {
  if (typeof template !== 'string') {
    return '';
  }

  return template.replace(/{{(.*?)}}/g, (_, key: string) => {
    const trimmedKey = key.trim();

    const value = variables[trimmedKey];
    return typeof value === 'string' || typeof value === 'number' ? value.toString() : '';
  });
}

export const stotraToHtml = (text: string): string => {
  const paragraphs = text.trim().split('\n\n');
  return (
    '<div>' +
    paragraphs
      .map(block => {
        const lines = block
          .split('\n')
          .map(l => l.trim())
          .join('<br/>');
        return `<p>${lines}</p>`;
      })
      .join('') +
    '</div>'
  );
};
