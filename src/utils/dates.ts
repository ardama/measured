export interface SimpleDate {
  year: number, month: number, day: number,
}

export class SimpleDate {
  constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  toDate() {
    return new Date(this.year, this.month - 1, this.day);
  }

  toString() {
    return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
  }

  toFormattedString(useOrdinal = false) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    const monthName = months[this.month - 1];
    const dayWithSuffix = useOrdinal ? `${this.day}${getOrdinalSuffix(this.day)}` : this.day;

    const currentYear = SimpleDate.today().year;
    if (this.year !== currentYear) {
      return `${String(this.month).padStart(2, '0')}/${String(this.day).padStart(2, '0')}/${this.year}`
    } 

    return `${monthName} ${dayWithSuffix}`;
  }

  toFormattedMonthYear() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthsAbbr = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentYear = SimpleDate.today().year;
    if (this.year !== currentYear) {
      return `${monthsAbbr[this.month - 1]} '${this.year.toString().slice(2)}`;
    }

    return `${months[this.month - 1]}`;
  }

  getPreviousDay() {
    const previousDate = new Date(this.year, this.month - 1, this.day);
    previousDate.setDate(previousDate.getDate() - 1);
    return SimpleDate.fromDate(previousDate);
  }

  getDaysInMonth() {
    // Ensure the month is between 1 and 12
    if (this.month < 1 || this.month > 12) {
      return 30;
    }
  
    return SimpleDate.getDaysInMonth(this.month, this.year);
  }

  getMonthsAgo(months: number = 1) {
    let month = this.month;
    let year = this.year;

    while (months > 0) {
      month--;

      if (month === 0) {
        month = 12;
        year--;
      }

      months--;
    }

    while (months < 0) {
      month++;

      if (month === 13) {
        month = 1;
        year++;
      }

      months++;
    }

    return new SimpleDate(year, month, Math.max(this.day, SimpleDate.getDaysInMonth(month, year)));
  }

  getDaysInPreviousMonth() {
    // Ensure the current month is between 1 and 12
    if (this.month < 1 || this.month > 12) {
      return 31;
    }
  
    // Calculate the previous month and year
    let previousMonth = this.month - 1;
    let previousYear = this.year;
  
    // If the current month is January, the previous month is December of the previous year
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear--;
    }
  
    // Use the getDaysInMonth function to get the number of days
    return new SimpleDate(previousYear, previousMonth, 1).getDaysInMonth();
  }

  getDayOfWeek() {
    const date = this.toDate();
    return date.getDay();
  }
  
  static isLeapYear(year: number) {
    // Leap year is divisible by 4
    // But if it's divisible by 100, it's not a leap year
    // Unless it's also divisible by 400, then it is a leap year
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  static fromString(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error('Invalid date string format. Expected "YYYY-MM-DD".');
    }
    return new SimpleDate(year, month, day);
  }

  static fromDate(date: Date) {
    return new SimpleDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  static today() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    now.setMinutes(now.getMinutes() - offset);
    return SimpleDate.fromDate(now);
  }

  static getDaysInMonth(month: number, year: number) {
    const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2 && SimpleDate.isLeapYear(year)) {
      return 29;
    }

    return days[month];
  }
}

export const generateDates = (numDays = 7, offset = 0) => {
  const dates = [];
  const now = new Date();
  const tzOffset = now.getTimezoneOffset();
  
  for (let i = 0; i < numDays; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i + offset));
    date.setMinutes(date.getMinutes());
    dates.unshift(SimpleDate.fromDate(date));
  }
  return dates;
}