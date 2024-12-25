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
  
  // habit: 'check',
  // habitFilled: 'minus',
  habit: 'bullseye-arrow',
  habitFilled: 'bullseye-arrow',
  pastHabit: 'history',
  
  measurement: 'ruler',
  measurementFilled: 'ruler',
  // measurement: 'beaker-outline',
  // measurementFilled: 'beaker',

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
  recorded: 'check',

  warning: 'alert-circle-outline',

  move: 'priority-low',
  drag: 'drag',
  up: 'chevron-up',
  down: 'chevron-down',
  left: 'chevron-left',
  right: 'chevron-right',
  
  close: 'window-close',
  hide: 'eye-off-outline',
  show: 'eye-outline',
  delete: 'delete-outline',
  edit: 'pencil-outline',
  
  chart: 'chart-box-outline',
  chartFilled: 'chart-box',
  
  progressNone: 'circle-outline',
  progressHalf: 'circle-slice-4',
  progressPartial: (percent: number) => `circle-slice-${Math.max(Math.floor(percent * 8) % 9, 1)}`,
  progressComplete: 'circle',
  
  collapse: 'format-vertical-align-center',
  expand: 'arrow-expand-vertical',


  repeatDaily: 'cached',
  repeatWeekly: 'calendar-sync',

  account: 'account-cog-outline',
  accountFilled: 'account-cog',

  settings: 'menu',
  // settings: 'tune',
  menu: 'dots-vertical',
  back: 'chevron-left',

  add: 'plus',
  subtract: 'minus',

  complete: 'check',
  incomplete: 'window-close',
  indeterminate: 'circle-medium',

}