import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  /** Возвращает true с понедельника по пятницу с 9 до 19 часов */
  isNowWorkingHours(): boolean {
    const date = new Date();
    const hour = date.getHours();
    const day = date.getDay();

    if (hour >= 9 && hour < 19 && day >= 1 && day <= 5) {
      return true;
    } else return false;
  }

  getDatesDelta(date1: string | number, date2: string | number): string {
    const msInSecond = 1000;
    const msInMinute = msInSecond * 60;
    const msInHour = msInMinute * 60;
    const msInDay = msInHour * 24;
    const msInWeek = msInDay * 7;

    let startDate = 0;
    let endDate = 0;

    let totalDelta = '';

    const timestamp1 = new Date(date1).getTime();
    if (Number.isNaN(timestamp1) || timestamp1 === undefined)
      return 'error: Not a time' + timestamp1;
    const timestamp2 = new Date(date2).getTime();
    if (Number.isNaN(timestamp2) || timestamp2 === undefined)
      return 'error: Not a time' + timestamp2;

    if (timestamp1 < timestamp2) {
      startDate = timestamp1;
      endDate = timestamp2;
    } else {
      startDate = timestamp2;
      endDate = timestamp1;
    }

    if (startDate === endDate) return '0ms';

    function getSeconds(delta: number) {
      if (delta > msInSecond) {
        const seconds = Math.floor(delta / msInSecond);
        delta -= seconds * msInSecond;
        totalDelta += seconds + 's ';
      }
      return totalDelta;
    }

    function getMinutes(delta: number) {
      if (delta > msInMinute) {
        const minutes = Math.floor(delta / msInMinute);
        delta -= minutes * msInMinute;
        totalDelta += minutes + 'm ';
      }
      return getSeconds(delta);
    }

    function getHours(delta: number) {
      if (delta > msInHour) {
        const hours = Math.floor(delta / msInHour);
        delta -= hours * msInHour;
        totalDelta += hours + 'h ';
      }
      return getMinutes(delta);
    }

    function getDays(delta: number) {
      if (delta > msInDay) {
        const days = Math.floor(delta / msInDay);
        delta -= days * msInDay;
        totalDelta += days + 'd ';
      }
      return getHours(delta);
    }

    function getWeeks(delta: number) {
      if (delta > msInWeek) {
        const weeks = Math.floor(delta / msInWeek);
        delta -= weeks * msInWeek;
        totalDelta += weeks + 'w ';
      }
      return getDays(delta);
    }

    function calculateDelta() {
      return getWeeks(endDate - startDate);
    }

    return calculateDelta();
  }

  getDateNow() {
    function pad(s: number) {
      return s < 10 ? '0' + s : s;
    }
    const newDate = new Date();
    const time = [
      newDate.getHours(),
      newDate.getMinutes(),
      newDate.getSeconds(),
    ]
      .map((t) => pad(t))
      .join(':');
    const date = [
      newDate.getDate(),
      newDate.getMonth() + 1,
      newDate.getFullYear(),
    ]
      .map((t) => pad(t))
      .join('.');

    return time + ' ' + date;
  }
}
