import { StyleSheet, View, ScrollView } from 'react-native';
import { useHabits, useMeasurements, useMeasurementsByIds, useAuthState } from '@s/selectors';
import { getDateRecordings, getMeasurementRecordingValue, getMeasurementTypeData, type Measurement, type MeasurementRecording } from '@t/measurements';
import { Checkbox, Icon, IconButton, ProgressBar, Surface, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { Fragment, useEffect, useRef, useState } from 'react';
import { SimpleDate } from '@u/dates';
import Header from '@c/Header';
import { useDispatch } from 'react-redux';
import { getHabitCompletion, getHabitPredicateIcon, getHabitPredicateLabel, type Habit } from '@t/habits';
import { formatNumber, formatTime } from '@u/helpers';
import Points from '@c/Points';
import { Icons } from '@u/constants/Icons';
import { callUpdateMeasurement } from '@s/dataReducer';


const HomeScreen = () => {
  const dispatch = useDispatch();
  const measurements = useMeasurements();

  const habits = useHabits();
  const dailyHabits = habits.filter((h) => !h.isWeekly)
  const weeklyHabits = habits.filter((h) => h.isWeekly);

  const today = SimpleDate.today();
  const [selectedDateIndex, setSelectedDateIndex] = useState(7 + today.getDayOfWeek());
  const [selectableDates, setSelectableDates] = useState(SimpleDate.generate(14, -6 + today.getDayOfWeek()));
  const selectedDate = selectableDates[selectedDateIndex];
  
  const selectedWeekStartDateIndex = selectedDateIndex - selectedDate.getDayOfWeek();
  const selectedWeekDates = selectableDates.slice(selectedWeekStartDateIndex, selectedWeekStartDateIndex + 7);

  const theme = useTheme();
  const styles = createStyles(theme);

  const selectedWeekDailyHabitPointTotals = selectedWeekDates.map((date, index) => {
    return dailyHabits.reduce((previous: number, habit: Habit) => {
      const [complete, _, __] = getHabitCompletion(habit, measurements, [date]);  
      return previous + (complete ? habit.points : 0);
    }, 0);
  });

  const selectedWeekWeeklyHabitPointTotals = [0, 0, 0, 0, 0, 0, 0];
  weeklyHabits.forEach((habit) => {
    selectedWeekDates.find((_, index) => {
      const dates = selectedWeekDates.slice(0, index + 1);
      const [complete] = getHabitCompletion(habit, measurements, dates);

      if (complete) selectedWeekWeeklyHabitPointTotals[index] += habit.points;
      return complete;
    });
  });

  const selectedDatePointTotal = (
    selectedWeekDailyHabitPointTotals[selectedDate.getDayOfWeek()]
    + selectedWeekWeeklyHabitPointTotals[selectedDate.getDayOfWeek()]
  );

  const selectedDateCumulativePointTotal = (
    selectedWeekDailyHabitPointTotals.slice(0, selectedDate.getDayOfWeek() + 1).reduce((previous: number, current: number) => previous + current, 0)
    + selectedWeekWeeklyHabitPointTotals.slice(0, selectedDate.getDayOfWeek() + 1).reduce((previous: number, current: number) => previous + current, 0)
  );

  const selectedWeekPointTotal = selectedWeekWeeklyHabitPointTotals.reduce((acc, curr, index) => acc + curr + (selectedWeekDailyHabitPointTotals[index] || 0), 0);
  const perWeekPointTarget = habits.reduce((previous: number, current: Habit) => {
    return previous + current.points * (current.isWeekly ? 1 : current.daysPerWeek);
  }, 0);

  const perDayPointTarget = perWeekPointTarget / 7;

  const selectedWeekMeasurementValues = new Map<string, (number | null)[]>();
  measurements.forEach(({ id }) => {
    const values = selectedWeekDates.map((date) => {
      return getMeasurementRecordingValue(id, date, measurements);
    });
    selectedWeekMeasurementValues.set(id, values);
  });

  let selectedDateLabel = selectedDate.toFormattedString();
  // if (selectedDateIndex === selectableDates.length - 1) selectedDateLabel = 'Today';
  // else if (selectedDateIndex === selectableDates.length - 2) selectedDateLabel = 'Yesterday';

  const measurementScopes = ['Day', 'Average', 'Total'];
  const [measurementScope, setMeasurementScope] = useState(0);

  const habitScopes = ['Day', 'Week'];
  const [habitScope, setHabitScope] = useState(1);

  const longPressPreviousTimeout = useRef<null | NodeJS.Timeout>(null);
  const longPressNextTimeout = useRef<null | NodeJS.Timeout>(null);
  const weeklyJumpCount = 30;
  const handleLongPressPrevious = (index: number, delay: number = 250, count: number = 1) => {
    const jump = count > weeklyJumpCount ? 1 : 1;
    let nextDayIndex = index - jump;
    if (nextDayIndex < 7) {
      setSelectableDates((current) => [...SimpleDate.generate(14, current.length), ...current]);
      nextDayIndex += 14;
    }
    setSelectedDateIndex(nextDayIndex);
    
    const nextDelay = count > weeklyJumpCount ? 25 : Math.max(delay - 25, 100);
    longPressPreviousTimeout.current = setTimeout(() => handleLongPressPrevious(nextDayIndex, nextDelay, count + 1), delay);
  }

  const handleLongPressNext = (index: number, delay: number = 250, count: number = 1) => {
    const jump = count > weeklyJumpCount ? 1 : 1;
    const nextDayIndex = Math.min(selectableDates.length - 1, index + jump);
    setSelectedDateIndex(nextDayIndex);

    const nextDelay = count > weeklyJumpCount ? 25 : Math.max(delay - 25, 100);
    longPressNextTimeout.current = setTimeout(() => handleLongPressNext(nextDayIndex, nextDelay, count + 1), delay);
  }

  // const displayedRecordings = selectedDateRecordings
  //   .filter((recording) => measurements.find(({ id }) => id === recording.measurementId )?.archived !== true)
  //   .sort((a, b) => {
  //     const aPriority = measurements.find(({ id }) => id === a.measurementId )?.priority || 0;
  //     const bPriority = measurements.find(({ id }) => id === b.measurementId )?.priority || 0;
  //     return aPriority - bPriority;
  //   }); 
  const displayedMeasurements = measurements
    .filter(m => !m.archived);
  const displayedHabits = habits
    .filter(h => !h.archived)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  return (
    <>
      {/* <Header title='Overview' /> */}
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Surface style={styles.recordingHeaderContainer}>
            <View style={styles.recordingHeader}>
              {selectedDateIndex === selectableDates.length - 1 ? (
                <View style={styles.recordingHeaderIcon}>
                  <Icon source='calendar-today' size={26} color={theme.colors.primary} />
                </View>
              ) : null}
              <Text style={styles.recordingHeaderDate} variant='titleLarge'>
                {selectedDateLabel}
              </Text>
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'chevron-left'}
                onPress={() => {
                  if (selectedDateIndex < 7) {
                    setSelectableDates([...SimpleDate.generate(7, selectableDates.length), ...selectableDates]);
                    setSelectedDateIndex(selectedDateIndex + 6);
                  } else {
                    setSelectedDateIndex(selectedDateIndex - 1);
                  }
                }}
                onLongPress={() => handleLongPressPrevious(selectedDateIndex)}
                onPressOut={() => {
                  if (longPressPreviousTimeout.current === null) return;
                  clearTimeout(longPressPreviousTimeout.current);
                  longPressPreviousTimeout.current = null;
                }}
                delayLongPress={600}
                />
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'chevron-right'}
                disabled={selectedDateIndex >= selectableDates.length - 1}
                onPress={() => {
                  setSelectedDateIndex(Math.min(selectableDates.length - 1, selectedDateIndex + 1));
                }}
                onLongPress={() => handleLongPressNext(selectedDateIndex)}
                onPressOut={() => {
                  if (longPressNextTimeout.current === null) return;
                  clearTimeout(longPressNextTimeout.current);
                  longPressNextTimeout.current = null;
                }}
                delayLongPress={600}
              />
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'page-last'}
                disabled={selectedDateIndex >= selectableDates.length - 1}
                onPress={() => {
                  setSelectedDateIndex(selectableDates.length - 1);
                }}
              />
            </View>
          </Surface>
          <View style={styles.weekContainer}>
            <View style={styles.weekProgressContainer}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <View
                  key={index}
                  style={{
                    ...styles.weekday,
                    left: `${100 * (index + 1) / 7}%`,
                    }}
                  >
                  <Text style={{ ...styles.weekdayText, ...(index === selectedDate.getDayOfWeek() ? styles.weekdayTextToday : {})}} variant='titleSmall'>{day}</Text>
                  {selectedDate.getDayOfWeek() === index ? <View style={styles.weekProgressMarker} /> : null}
                </View>
              ))}
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={(selectedWeekPointTotal) / perWeekPointTarget || 0}
                  style={styles.baseProgress}
                  color={theme.colors.inversePrimary}
                />
              </View>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={(selectedWeekPointTotal) / perWeekPointTarget || 0}
                  style={styles.overlapProgress}
                  color={theme.colors.onSurfaceDisabled}
                />
              </View>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={selectedDateCumulativePointTotal / perWeekPointTarget || 0}
                  style={styles.overlapProgress}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={(selectedDateCumulativePointTotal - selectedDatePointTotal) / perWeekPointTarget || 0}
                  style={styles.overlapProgress}
                  color={theme.colors.inversePrimary}
                />
              </View>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={(selectedDateCumulativePointTotal - selectedDatePointTotal) / perWeekPointTarget || 0}
                  style={styles.overlapProgress}
                  color={theme.colors.onSurfaceDisabled}
                />
              </View>
            </View>
            <View style={styles.weekPointsContainer}>
              <Points style={{ height: 28, minWidth: 38 }} points={selectedWeekPointTotal} />
              <Text style={styles.weekPointsDivider}> / </Text>
              <Text style={styles.weekPointsTarget}>{perWeekPointTarget}</Text>
            </View>
          </View>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.recordingContainerHeader}>
            <View style={styles.recordingContainerHeaderIcon}>
              <Icon source='clipboard-edit-outline' size={18} />
            </View>
            <Text style={styles.recordingTitle} variant='titleMedium'>Measurements</Text>
            <IconButton
              style={styles.recordingHeaderScopeButton}
              icon={'chevron-left'}
              size={18}
              iconColor={theme.colors.primary}
              onPress={() => { setMeasurementScope(measurementScope - 1) }}
              disabled={measurementScope === 0}
            />
            <Text variant='titleSmall' style={styles.recordingHeaderScopeText}>
              {measurementScopes[measurementScope]}
            </Text>
            <IconButton
              style={styles.recordingHeaderScopeButton}
              icon={'chevron-right'}
              size={18}
              iconColor={theme.colors.primary}
              disabled={measurementScope === measurementScopes.length - 1}
              onPress={() => { setMeasurementScope(measurementScope + 1); }}
            />
          </View>
          <View style={styles.recordingContainer}>
            <View style={styles.recordingView}>
              {
                displayedMeasurements.length ? displayedMeasurements.map((measurement) => {
                  const { id, recordings } = measurement;
                  const recordingIndex = recordings.findIndex(({ date }) => date == selectedDate.toString());
                  const recording = recordings[recordingIndex] || { date: selectedDate.toString(), value: 0 };
                  const isNewRecording = recordingIndex < 0;

                  const updateRecording = (nextValue: number) => {
                    const nextRecording = { ...recording, value: nextValue };
                    const nextRecordings = [...recordings];
                    isNewRecording ? nextRecordings.push(nextRecording) : nextRecordings.splice(recordingIndex, 1, nextRecording);
                    dispatch(callUpdateMeasurement({ ...measurement, recordings: nextRecordings }));
                  }

                  return (
                    <RecordingMeasurementItem
                      key={id}
                      measurement={measurement}
                      date={selectedDate}
                      weekMeasurementValues={selectedWeekMeasurementValues.get(measurement.id) || []}
                      scope={measurementScopes[measurementScope].toLowerCase()}
                      onValueChange={updateRecording}
                    />
                  );
                }) : (
                  <View style={styles.noData}>
                    <View style={styles.noDataIcon}>
                      <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={styles.noDataText} variant='bodyLarge'>No active measurements</Text>
                  </View>
                )
              }
            </View>
          </View>
          <View style={styles.recordingContainerHeader}>
            <View style={styles.recordingContainerHeaderIcon}>
              <Icon source='checkbox-multiple-marked-outline' size={18} />
            </View>
            <Text style={styles.recordingTitle} variant='titleMedium'>Habits</Text>
            <IconButton
              style={styles.recordingHeaderScopeButton}
              icon={'chevron-left'}
              size={18}
              iconColor={theme.colors.primary}
              onPress={() => { setHabitScope(habitScope - 1) }}
              disabled={habitScope === 0}
            />
            <Text variant='titleSmall' style={styles.recordingHeaderScopeText}>
              {habitScopes[habitScope]}
            </Text>
            <IconButton
              style={styles.recordingHeaderScopeButton}
              icon={'chevron-right'}
              size={18}
              iconColor={theme.colors.primary}
              disabled={habitScope === habitScopes.length - 1}
              onPress={() => { setHabitScope(habitScope + 1); }}
            />
          </View>
          <View style={styles.recordingContainer}>
            {displayedHabits.length ? (
              <View style={styles.dailyPointTotalContainer}>
                {habitScopes[habitScope] === 'Week' ? (
                  <>
                    {/* <Text style={{...styles.dailyPointTotalTitle, flex: 1}} variant='titleMedium'>Daily totals: </Text> */}
                    {selectedWeekWeeklyHabitPointTotals.map((weekly, index) => {
                      const daily = selectedWeekDailyHabitPointTotals[index] || 0;
                      const total = daily + weekly;
                      
                      return (
                        <View key={index}>
                          <Points style={styles.dailyPointTotal} points={total} size='small' disabled={index !== selectedDate.getDayOfWeek()} />
                        </View>
                      )
                    })}
                  </>
                ) : (
                  <>
                    <Text style={styles.dailyPointTotalTitle} variant='titleMedium'>Daily total: </Text>
                    <View>
                      <Points style={styles.dailyPointTotal} points={selectedDatePointTotal} size='large' />
                    </View>
                  </>
                )}
              </View>
            ) : null}
            <View style={styles.recordingView}>
              {
                displayedHabits.length ? displayedHabits.map((habit) => {
                  return (
                    <RecordingDataHabit
                      key={habit.habitId}
                      habit={habit}
                      date={selectedDate}
                      weekDates={selectedWeekDates}
                      measurements={measurements}
                      scope={habitScopes[habitScope].toLowerCase()}
                    />
                  );
                }) : (
                  <View style={styles.noData}>
                    <View style={styles.noDataIcon}>
                      <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={styles.noDataText} variant='bodyLarge'>No active habits</Text>
                  </View>
                )
              }
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    padding: 16,
  },
  recordingHeaderContainer: {
    paddingVertical: 4,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 16,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  recordingHeaderDate: {
    flex: 1,
    paddingLeft: 12,
    color: theme.colors.primary,
  },
  recordingHeaderIcon: {
    paddingLeft: 8,
  },
  recordingHeaderButton: {
    marginHorizontal: 2,
  },
  weekContainer: {
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: 8,
    marginTop: 8,
    flexDirection: 'row',
    height: 64,
  },
  weekday: {
    position: 'absolute',
    top: 32,
    width: 32,
    height: 32,
    lineHeight: 32,
    textAlign: 'center',
    marginLeft: -16,
    borderRadius: 16,
  },
  weekdayText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceDisabled,
  },
  weekdayTextToday: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  weekProgressContainer: {
    position: 'relative',
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  overlapProgress: {
    height: 12,
    borderRadius: 6,
    flexGrow: 0,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  baseProgress: {
    height: 12,
    borderRadius: 6,
    flexGrow: 0,
    marginTop: 14,
    marginBottom: 4,
  },
  weekProgressMarker: {
    top: 22,
    position: 'absolute',
    height: 6,
    width: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    flexGrow: 0,
    left: 13,
  },
  weekPointsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  weekPointsDivider: {
    marginHorizontal: 1,
    lineHeight: 28,
    fontSize: 16,
    color: theme.colors.outline,
  },
  weekPointsTarget: {
    fontSize: 16,
    lineHeight: 28,
    color: theme.colors.outline,
  },
  weekPointsIcon: {
    marginTop: 4,
    marginLeft: 4,
  },
  scopeButtonsContainer: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 38,
    width: '100%',
  },
  scopeButtonsWrapper: {
    position: 'absolute',

    width: '40%',
    minWidth: 300,
    borderRadius: 19,
  },
  scopeButtons: {
  },
  scopeButton: {
    borderWidth: 0,
  },
  scopeButtonLabel: {    
  },
  content: {
    // paddingHorizontal: 16,
    paddingTop: 0,
    // paddingBottom: 72,
  },
  recordingContainerHeader: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  recordingContainerHeaderIcon: {
    marginLeft: 8
  },
  recordingTitle: {
    borderRadius: 16,
    flex: 1,
    // color: theme.colors.primary,
  },
  recordingHeaderScopeButton: {

  },
  recordingHeaderScopeText: {
    width: 60,
    textAlign: 'center',
    color: theme.colors.primary,
  },
  recordingContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recordingView: {
    
  },
  recordingDivider: {
    marginVertical: 24,
  },
  dailyPointTotalContainer: {
    marginTop: 8,
    height: 28,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dailyPointTotal: {
    width: 36,
    justifyContent: 'center',
  },
  dailyPointTotalTitle: {
    marginRight: 8,
    color: theme.colors.primary,
  },
  noData: {
    flexDirection: 'row',
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: theme.colors.outline,
  },
  noDataIcon: {
    marginRight: 8,
  },
});

export default HomeScreen;

type RecordingMeasurementItemProps = {
  measurement: Measurement,
  date: SimpleDate,
  weekMeasurementValues: (number | null)[],
  scope: string,
  onValueChange: (nextValue: number) => void,
}

const RecordingMeasurementItem = ({ measurement, date: currentDate, weekMeasurementValues, scope, onValueChange } : RecordingMeasurementItemProps) : JSX.Element | null  => {
  const theme = useTheme();
  const typeData = getMeasurementTypeData(measurement.type);
  if (!typeData) return null;
  
  const isBool = measurement.type === 'bool';
  const isTime = measurement.type === 'time';
  const isCombo = measurement.type === 'combo';
  
  const longPressLeftInterval = useRef<null | NodeJS.Timeout>(null);
  const longPressRightInterval = useRef<null | NodeJS.Timeout>(null);

  const value = weekMeasurementValues[currentDate.getDayOfWeek()];

  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleLongPressLeft = () => {
    longPressLeftInterval.current = setInterval(() => {
      onValueChange(valueRef.current === null ? measurement.initial : valueRef.current - measurement.step);
    }, 125);
  }
  const handleLongPressRight = () => {
    longPressRightInterval.current = setInterval(() => {
      onValueChange(valueRef.current === null ? measurement.initial : valueRef.current + measurement.step);
    }, 125);
  }

  let controlContent;
  if (scope === 'average' || scope === 'total') {
    const total = weekMeasurementValues.reduce((acc: number, curr) => acc + (curr || 0), 0);
    const count = weekMeasurementValues.reduce((acc: number, curr) => acc + (curr === null ? 0 : 1), 0);
    const average = isTime ? formatTime(total / count) : formatNumber(total / count);
    const unit = isTime ? '' : measurement.unit;

    const value = scope === 'average' ? average : isTime ? '-- : --' : total;
    controlContent = (
      <View style={[measurementStyles.content, { marginRight: 16 }]}>
        <Text style={measurementStyles.value} variant='titleMedium'>{value}</Text>
        {unit ? <Text style={measurementStyles.valueLabel} variant='bodyLarge'>{unit}</Text> : null}
        {isBool ? (
          <View style={measurementStyles.valueLabel}>
            <Icon source='check' size={18} />
          </View>
        ) : null}
      </View>
    );
  } else if (isBool) {
    controlContent = (
      <View style={measurementStyles.content}>
        <Text style={measurementStyles.value} variant='titleMedium'> </Text>
        <IconButton size={18} mode={value === 0 ? 'contained' : undefined} icon='window-close' onPress={() => {
          onValueChange(0);
        }}/>
        <IconButton size={18} mode={value ? 'contained' : undefined} icon='check' onPress={() => {
          onValueChange(1);
        }}/>
      </View>
    );
  } else {
    const unitString = value === null ? '' : measurement.unit;
    const valueString = value === null ? '' : isTime ? formatTime(value) : formatNumber(value);
    controlContent = (
      <View style={measurementStyles.content}>
        <Text style={measurementStyles.value} variant='bodyLarge'>{valueString}</Text>
        {unitString ? <Text style={measurementStyles.valueLabel} variant='bodyLarge'>{unitString}</Text> : null}
        {isCombo ? <View style={{marginRight: 16}} /> : (
          <>
            <IconButton
              size={18}
              icon='minus'
              disabled={!isTime && !value}
              onPress={() => {
                onValueChange(value === null ? measurement.initial : value - measurement.step);
              }}
              onLongPress={() => {
                handleLongPressLeft();
              }}
              onPressOut={() => {
                if (longPressLeftInterval.current === null) return;
                clearInterval(longPressLeftInterval.current);
                longPressLeftInterval.current = null;
              }}
              delayLongPress={250}
              />
            <IconButton
              size={18}
              icon='plus'
              onPress={() => {
                onValueChange(value === null ? measurement.initial : value + measurement.step);
              }}
              onLongPress={() => {
                handleLongPressRight();
              }}
              onPressOut={() => {
                if (longPressRightInterval.current === null) return;
                clearInterval(longPressRightInterval.current);
                longPressRightInterval.current = null;
              }}
              delayLongPress={250}
            />
          </>
        )}
      </View>
    )
  }
  return (
    <>
      <View style={measurementStyles.container}>
        <View style={measurementStyles.typeIconContainer}>
          <Icon source={typeData.icon} size={24} />
        </View>
          <Text numberOfLines={1} ellipsizeMode="tail" variant='titleMedium' style={measurementStyles.labelActivity}>{measurement.name}</Text>
          {measurement.variant ? (
            <>
              <Text variant='bodyLarge' style={measurementStyles.labelDivider}> : </Text>
              <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={[measurementStyles.labelVariant, { color: theme.colors.outline }]}>{measurement.variant}</Text>
            </>
          ) : null}
          {controlContent}
      </View>
    </>
  );
}

const measurementStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  typeIconContainer: {
    marginRight: 12,
    marginLeft: 4,
  },
  labelActivity: {
    flexShrink: 1,
  },  
  labelDivider: {
    marginHorizontal: 1,
    flexShrink: 0,
  },
  labelVariant: {
    flexShrink: 1,
  },
  content: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    flexGrow: 1,
    textAlign: 'right',
  },
  valueLabel: {
    marginLeft: 6,
    textAlign: 'right',
  },
});

type RecordingDataHabitProps = {
  habit: Habit,
  date: SimpleDate,
  weekDates: SimpleDate[],
  measurements: Measurement[],
  scope: string,
}

const RecordingDataHabit = (props : RecordingDataHabitProps) : JSX.Element | null => {
  const { habit, date, weekDates, measurements, scope } = props;

  const theme = useTheme();
  const habitStyles = createHabitStyles(theme);

  const dayRecordings = getDateRecordings(measurements, date);
  const weekRecordings = weekDates.map((weekDate) => getDateRecordings(measurements, weekDate));

  let content;
  if (scope === 'week') {
    const firstWeeklyCompletionIndex = habit.isWeekly ? [undefined, undefined, undefined, undefined, undefined, undefined, undefined].map((_, index) => {
      const [complete] = getHabitCompletion(habit, measurements, weekDates.slice(0, index + 1));
      return complete;
    }).findIndex((completion) => completion) : -1;

    content = (
      <View style={habitStyles.checkboxes}>
        {weekDates.map((weekDate, index) => {
          const dates = habit.isWeekly ? weekDates : [weekDate];
          const [complete] = getHabitCompletion(habit, measurements, dates);
          
          const isToday = index === date.getDayOfWeek();
          const isFuture = SimpleDate.today().toString().localeCompare(weekDate.toString()) < 0;
          let status = 'indeterminate';
          let color = theme.colors.surfaceVariant;
          if (isFuture) {
            status = 'unchecked';
          } else if (habit.isWeekly && firstWeeklyCompletionIndex !== -1) {
            if (index === firstWeeklyCompletionIndex) {
              status = 'checked';
              color = theme.colors.outlineVariant;
            } else if (index > firstWeeklyCompletionIndex) {
              status = 'unchecked';
            }
          } else if (complete) {
            color = theme.colors.outlineVariant;
            status = 'checked';
          }
          
          if (isToday) {
            color = theme.colors.primary;
          }
        
          return (
            <View
              key={weekDate.toString()}
              style={habitStyles.checkboxContainer}>
              <Checkbox.IOS
                status={status as ('unchecked' | 'indeterminate' | 'checked')}
                color={color}
                pointerEvents='none'
                style={habitStyles.checkbox}
              />
            </View>
          );
        })}
      </View>
    );
  } else {
    const dates = weekDates.slice(habit.isWeekly ? 0 : date.getDayOfWeek(), date.getDayOfWeek() + 1);
    const [complete, conditionCompletions, conditionValues, conditionProgressions] = getHabitCompletion(habit, measurements, dates);

    const predicateColor = complete ? theme.colors.primary : theme.colors.onSurfaceDisabled;
  
    content = (
      <>
        <View style={habitStyles.progressContainers}>
          {habit.conditions.length === 1 ? null : (
            <View style={habitStyles.multipleConditionContainer}>
              <View style={habitStyles.predicateContainer}>
                <Icon source={getHabitPredicateIcon(habit.predicate)} size={14} color={predicateColor} />
                <Text style={{ ...habitStyles.predicate, color: predicateColor}} variant='titleSmall'>{getHabitPredicateLabel(habit.predicate)}</Text>
              </View>
              <Points points={habit.points} disabled={!complete} />
            </View>
          )}
          {habit.conditions.map(({ target, measurementId }, index) => {
            const measurement = measurements.find(({ id }) => id === measurementId);
            if (!measurement) return null;

            const conditionCompletion = conditionCompletions[index];
            const conditionValue = conditionValues[index];
            const conditionProgress = conditionProgressions[index];
            
            const isBool = measurement.type === 'bool';
            const isTime = measurement.type === 'time';

            const progressLabelColor = theme.colors.onSurface;
            const progressColor = conditionCompletion ? theme.colors.primary : theme.colors.onSurfaceDisabled;
            
            const valueString = conditionValue === null ? '-' : isTime ? formatTime(conditionValue) : formatNumber(conditionValue)
            return (
              <Fragment key={`${measurementId}${target}`}>
                <View style={habitStyles.progressContainer}>
                  <View style={habitStyles.progressBarContainer}>
                    <ProgressBar
                      style={[habitStyles.progressBar, conditionCompletion ? habitStyles.progressBarComplete : {}]}
                      progress={conditionProgress || 0}
                      color={progressColor}
                    />
                  </View>
                  <View style={habitStyles.progressLabel}>
                    {isBool ? (
                      <Icon
                        source={conditionValue ? 'check' : 'window-close'}
                        size={16}
                      />
                    ) : (
                      <Text style={{ ...habitStyles.progressLabelCurrent, color: progressLabelColor }} variant='bodyMedium'>
                        {valueString}
                      </Text>
                    )}
                    {false ? (
                      null
                    ) : (
                      <Text style={{ ...habitStyles.progressLabelDivider, color: progressLabelColor }} variant='bodyMedium'>
                        {' / '}
                      </Text>
                    )}
                    {measurement.type === 'bool' ? (
                      <Icon
                        source='check'
                        size={16}
                      />
                    ) : (
                      <Text style={{ ...habitStyles.progressLabelTarget, color: progressLabelColor }} variant='bodyMedium' numberOfLines={1}>
                        {isTime ? formatTime(target) : formatNumber(target)}{measurement.unit ? ` ${measurement.unit}` : ''}
                      </Text>
                    )}
                  </View>
                  {habit.conditions.length === 1 ? (
                    <Points style={{ marginLeft: 4 }} points={habit.points} disabled={!complete} />
                  ) : (
                    <View style={[habitStyles.completionIcon, conditionCompletion ? habitStyles.completionIconComplete : {}]}>
                      <Icon
                        source={conditionCompletion ? 'check' : 'window-close'}
                        color={conditionCompletion ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled}
                        size={16}
                      />
                    </View>
                  )}
                </View>
              </Fragment>
            )
          })}
        </View>
      </>
    );
  }

  return (
    <>
      <View style={habitStyles.container}>
        <View style={habitStyles.labelContainer}>
          <View style={habitStyles.titleContainer}>
            <View style={habitStyles.icon}>
              <Icon source={habit.isWeekly ? 'calendar-sync' : 'sync'} size={16} />
            </View>
            <Text variant='titleMedium'>{habit.name}</Text>
          </View>
          {scope === 'day' ? (
            <>
              {habit.conditions.map(({ measurementId, target }) => {
                const measurement = measurements.find(({ id }) => id === measurementId);
                if (!measurement) return;

                const typeData = getMeasurementTypeData(measurement.type);    
                return  (
                  <View key={`${measurementId}${target}`} style={habitStyles.labelSubtitle}>
                    <View style={habitStyles.labelSubtitleIcon}>
                      <Icon source={typeData.icon} size={16} />
                    </View>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={habitStyles.labelSubtitleActivity} variant='titleSmall'>{measurement?.name}</Text>
                    {measurement.variant ? (
                      <>
                        <Text style={habitStyles.labelSubtitleDivider} variant='bodyMedium'> : </Text>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={habitStyles.labelSubtitleVariant} variant='bodyMedium'>{measurement?.variant}</Text>
                      </>
                    ) : null}
                  </View>
                )
              })}
            </>
          ) : null}
        </View>
        {content}
      </View>
    </>
  );
}

const createHabitStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  icon: {
    marginRight: 2,
  },
  typeIconContainer: {
  },
  typeIcon: {
    
  },
  labelContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predicateContainer: {
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',  
  },
  predicate: {
    color: theme.colors.outline,
    marginLeft: 5,
  },
  labelSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',

    // backgroundColor: theme.colors.surfaceVariant,
    paddingLeft: 18,
    borderRadius: 8,
    marginTop: 6,
    paddingVertical: 4,
  },
  labelSubtitleIcon: {
    marginRight: 4,
  },
  labelSubtitleActivity: {
    flexGrow: 0,
    flexShrink: 1,
  },
  labelSubtitleDivider: {
    flexGrow: 0,
    flexShrink: 0,
  },
  labelSubtitleVariant: {
    color: theme.colors.outline,
    flexShrink: 0,
  },
  progressContainers: {
    height: '100%',
    width: '50%',
    flexGrow: 0,
    flexDirection: 'column',
    marginLeft: 8,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  multipleConditionContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingVertical: 3,
  },
  progressBarContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    // alignItems: 'flex-start',
  },
  progressBar: {
    height: 7,
    borderRadius: 200,
    // borderWidth: 2,
    // borderColor: 'transparent',
    // backgroundColor: 'transparent',
  },
  progressBarComplete: {
    borderColor: theme.colors.primary,
  },
  progressLabel: {
    position: 'absolute',
    top: 9,
    right: 38,

    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 22,
  },
  progressLabelCurrent: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  progressLabelDivider: {
    marginHorizontal: 1,
  },
  progressLabelTarget: {

  },
  progressLabelIcon: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  completionIcon: {
    width: 22,
    height: 22,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  completionIconComplete: {
    backgroundColor: theme.colors.primary,
  },
  checkboxes: {
    flexDirection: 'row',
  },
  checkboxContainer: {
  },
  checkbox: {
    padding: 0,
  },
});
