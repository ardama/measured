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

  getDaysInMonth() {
    // Ensure the month is between 1 and 12
    if (this.month < 1 || this.month > 12) {
      return 30;
    }
  
    // Array of days in each month
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
    // Check for leap year and adjust February
    if (this.month === 2 && this.isLeapYear()) {
      return 29;
    }
  
    return daysInMonth[this.month];
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
  
  isLeapYear() {
    // Leap year is divisible by 4
    // But if it's divisible by 100, it's not a leap year
    // Unless it's also divisible by 400, then it is a leap year
    return (this.year % 4 === 0 && this.year % 100 !== 0) || (this.year % 400 === 0);
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