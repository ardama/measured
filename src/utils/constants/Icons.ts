export const Icons = {
  points: 'trophy-award',
  pointsIncomplete: 'trophy-award',

  predicateOr: 'gamepad-circle-up',
  predicateAnd: 'gamepad-circle',

  operatorGte: 'greater-than-or-equal',
  operatorLte: 'less-than-or-equal',
  operatorGt: 'greater-than',
  operatorLt: 'less-than',
  operatorEq: 'equal',
  operatorNot: 'not-equal-variant',
  
  habit: 'bullseye-arrow',
  habitFilled: 'bullseye-arrow',
  pastHabit: 'history',
  
  measurement: 'beaker-outline',
  measurementFilled: 'beaker',

  measurementTypeDuration: 'timer-outline',
  measurementTypeTime: 'clock-outline',
  measurementTypeCount: 'numeric-1-box-outline',
  measurementTypeBool: 'checkbox-outline',
  measurementTypeCombo: 'plus-minus-variant',

  measurementOperatorAdd: 'plus',
  measurementOperatorSubtract: 'minus',
  measurementOperatorMultiply: 'close',
  measurementOperatorDivide: 'division',

  recording: 'clipboard-edit-outline',
  recordingFilled: 'clipboard-edit',

  warning: 'alert-circle-outline',

  move: 'priority-low',
  up: 'chevron-up',
  down: 'chevron-down',
  
  close: 'window-close',
  hide: 'eye-off-outline',
  show: 'eye-off-outline',
  
  chart: 'chart-box-outline',
  chartFilled: 'chart-box',
  
  progressNone: 'circle-outline',
  progressHalf: 'circle-slice-4',
  progressPartial: (percent: number) => `circle-slice-${Math.max(Math.floor(percent * 8) % 9, 1)}`,
  progressComplete: 'circle-slice-8',
  
  collapse: 'format-vertical-align-center',
  expand: 'arrow-expand-vertical',


  repeatDaily: 'cached',
  repeatWeekly: 'calendar-sync',

  account: 'account-cog-outline',
  accountFilled: 'account-cog',

  settings: 'tune',
  menu: 'dots-vertical',

  add: 'plus',

}