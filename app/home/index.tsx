import { StyleSheet, View, ScrollView } from 'react-native';
import { useComputedHabits, useMeasurements } from '@s/selectors';
import { getDateRecordings, getMeasurementRecordingValue, getMeasurementTypeData, getMeasurementTypeIcon, type Measurement } from '@t/measurements';
import { Button, Icon, IconButton, ProgressBar, Surface, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { useEffect, useRef, useState } from 'react';
import { SimpleDate } from '@u/dates';
import Header from '@c/Header';
import { getHabitCompletion, getHabitPredicateIcon, getHabitPredicateLabel, type ComputedHabit } from '@t/habits';
import { formatValue, intersection, range } from '@u/helpers';
import Points from '@c/Points';
import { Icons } from '@u/constants/Icons';
import { callUpdateMeasurements } from '@s/dataReducer';
import { useDispatch } from 'react-redux';


const RecordingsScreen = () => {
  const measurements = useMeasurements();

  const habits = useComputedHabits();
  const dailyHabits = habits.filter((h) => !h.isWeekly)
  const weeklyHabits = habits.filter((h) => h.isWeekly);

  const today = SimpleDate.today();

  const [selectedDate, setSelectedDate] = useState(today);
  const selectedWeekDates = SimpleDate.generateWeek(selectedDate);
  const previousWeekDates = SimpleDate.generateWeek(selectedDate.getDaysAgo(7));
  const nextWeekDates = SimpleDate.generateWeek(selectedDate.getDaysAgo(-7));

  const theme = useTheme();
  const styles = createStyles(theme);


  const [tempRecordingsMap, setTempRecordingsMap] = useState<Map<string, Map<string, number>>>(new Map());
  const mergedRecordingsMap = new Map(measurements.map(({ id, recordings}) => [
    id,
    new Map(recordings.map(({ date, value }) => [
      date,
      value,
    ])),
  ]));
  [...tempRecordingsMap.entries()].forEach(([id, recordingsMap]) => {
    const mergedRecordings = mergedRecordingsMap.get(id) || new Map<string, number>();
    [...recordingsMap.entries()].forEach(([date, value]) => {
      mergedRecordings.set(date, value);
    });
    mergedRecordingsMap.set(id, mergedRecordings);
  });

  const selectedWeekDailyHabitPointTotals = selectedWeekDates.map((date) => {
    return date.after(today) ? 0 : dailyHabits.reduce((previous: number, habit: ComputedHabit) => {
      const [complete, _, __] = getHabitCompletion(habit, measurements, [date], mergedRecordingsMap);  
      return previous + (complete ? habit.points : 0);
    }, 0);
  });

  const selectedWeekWeeklyHabitPointTotals = [0, 0, 0, 0, 0, 0, 0];
  weeklyHabits.forEach((habit) => {
    selectedWeekDates.filter((date) => !date.after(today)).find((_, index) => {
      const dates = selectedWeekDates.slice(0, index + 1);
      const [complete] = getHabitCompletion(habit, measurements, dates, mergedRecordingsMap);

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
  const perWeekPointTarget = habits.reduce((previous: number, current: ComputedHabit) => {
    return previous + current.points * (current.isWeekly ? 1 : current.daysPerWeek);
  }, 0);

  const weekProgressTarget = Math.max(selectedWeekPointTotal, perWeekPointTarget);

  const perDayPointTarget = perWeekPointTarget / 7;

  const selectedWeekMeasurementValues = new Map<string, (number | null)[]>();
  measurements.forEach(({ id }) => {
    const values = selectedWeekDates.map((date) => {
      return getMeasurementRecordingValue(id, date, measurements, mergedRecordingsMap);
    });
    selectedWeekMeasurementValues.set(id, values);
  });

  const dispatch = useDispatch();
  const updateRecordings = useRef<null | NodeJS.Timeout>(null);
  const queueRecordingUpdate = (value: number, measurementId: string, date: string) => {
    const nextTempRecordingsMap = new Map([...tempRecordingsMap.entries()].map(([ id, recordingsMap]) => [
      id,
      new Map([...recordingsMap.entries()].map((entry) => entry)),
    ]));

    const recordingsMap = nextTempRecordingsMap.get(measurementId) || new Map<string, number>();
    recordingsMap.set(date, value);
    nextTempRecordingsMap.set(measurementId, recordingsMap);
    setTempRecordingsMap(nextTempRecordingsMap);

    if (updateRecordings.current) clearTimeout(updateRecordings.current);
    updateRecordings.current = setTimeout(() => {
      const updatedMeasurements: Measurement[] = [];
      [...nextTempRecordingsMap.entries()].forEach(([measurementId, recordingsMap]) => {
        const measurement = measurements.find(({ id }) => id === measurementId);
        if (!measurement) return;

        let hasUpdates = false;
        const nextRecordings = [...measurement.recordings];
        [...recordingsMap.entries()].forEach(([date, value]) => {
          const recordingIndex = nextRecordings.findIndex((recording) => recording.date === date);
          const recording = nextRecordings[recordingIndex];
          if (recording?.value !== value) {
            recordingIndex ===  -1 ? nextRecordings.push({ date, value }) : nextRecordings.splice(recordingIndex, 1, { ...recording, value });
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          updatedMeasurements.push({ ...measurement, recordings: nextRecordings });
        }
      });

      dispatch(callUpdateMeasurements(updatedMeasurements));
      setTempRecordingsMap(new Map());
    }, 3000);
  }

  const longPressPreviousTimeout = useRef<null | NodeJS.Timeout>(null);
  const longPressNextTimeout = useRef<null | NodeJS.Timeout>(null);
  const handleLongPressPrevious = (selectedDate: SimpleDate, delay: number = 250) => {
    const nextSelectedDate = selectedDate.getDaysAgo(7);
    setSelectedDate(nextSelectedDate);
    
    const nextDelay = Math.max(delay - 25, 100);
    longPressPreviousTimeout.current = setTimeout(() => handleLongPressPrevious(nextSelectedDate, nextDelay), delay);
  }

  const handleLongPressNext = (selectedDate: SimpleDate, delay: number = 250) => {
    const nextSelectedDate = selectedDate.getDaysAgo(-7);
    setSelectedDate(nextSelectedDate);
    
    const nextDelay = Math.max(delay - 25, 100);
    longPressNextTimeout.current = setTimeout(() => handleLongPressNext(nextSelectedDate, nextDelay), delay);
  }

  const displayedMeasurements = measurements
    .filter(m => !m.archived);
  const [expandedMeasurements, setExpandedMeasurements] = useState(new Set());
  const displayedMeasurementIds = displayedMeasurements.map(({ id }) => id);
  const displayedExpandedMeasurements = intersection(expandedMeasurements, new Set(displayedMeasurementIds));
  const areAllMeasurementsExpanded = displayedExpandedMeasurements.size === displayedMeasurements.length;
  
  const displayedHabits = habits
    .filter(h => !h.archived)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const [expandedHabits, setExpandedHabits] = useState(new Set());
  const displayedHabitIds = displayedHabits.map(({ id }) => id);
  const displayedExpandedHabits = intersection(expandedHabits, new Set(displayedHabitIds));
  const areAllHabitsExpanded = displayedExpandedHabits.size === displayedHabits.length;
  
  return (
    <>
      <Header
        showMenuButton
        title={'Recordings'}
        actionButton={SimpleDate.daysBetween(today, selectedDate) ? (
          <Button
            mode='text'
            textColor={theme.colors.onSurface}
            onPress={() => setSelectedDate(today)}
          >
            TODAY
          </Button>
        ) : null}
      />
      <View style={styles.container}>
        <ScrollView style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <IconButton
              style={styles.timelineHeaderButton}
              icon={'chevron-left'}
              onPress={() => setSelectedDate(selectedDate.getDaysAgo(7))}
              onLongPress={() => handleLongPressPrevious(selectedDate)}
              onPressOut={() => {
                if (longPressPreviousTimeout.current === null) return;
                clearTimeout(longPressPreviousTimeout.current);
                longPressPreviousTimeout.current = null;
              }}
              delayLongPress={600}
            />
            <Text variant='bodyMedium' style={styles.timeHeaderText}>
              {selectedWeekDates[0].toFormattedString()} - {selectedWeekDates[6].toFormattedString()}
            </Text>
            <IconButton
              style={styles.timelineHeaderButton}
              icon={'chevron-right'}
              onPress={() => setSelectedDate(selectedDate.getDaysAgo(-7))}
              onLongPress={() => handleLongPressNext(selectedDate)}
              onPressOut={() => {
                if (longPressNextTimeout.current === null) return;
                clearTimeout(longPressNextTimeout.current);
                longPressNextTimeout.current = null;
              }}
              delayLongPress={600}
            />
          </View>
          <View style={styles.timelineContent}>
            {selectedWeekDates.map((date) => {
              const dayOfWeek = date.getDayOfWeekLabel();
              const isSelected = date.equals(selectedDate);
              const isToday = date.equals(today);

              return (
                <Surface
                  key={date.toString()}
                  elevation={isSelected ? 0 : 0}
                  style={[
                    styles.timelineDate,
                    isToday ? styles.timelineDateToday : {},
                    isSelected ? styles.timelineDateSelected : {},
                  ]}
                >
                  <TouchableRipple
                    onPress={() => setSelectedDate(date)}
                    style={[
                      styles.timelineDateContent,
                      isToday ? styles.timelineDateContentToday : {},
                      isSelected ? styles.timelineDateContentSelected : {},
                    ]}
                  >
                    <>
                      <Text
                        style={[
                          styles.timelineDateDayOfWeek,
                          isToday ? styles.timelineDateDayOfWeekToday : {},
                          isSelected ? styles.timelineDateDayOfWeekSelected : {},
                        ]}
                        >
                        {dayOfWeek.toUpperCase()}
                      </Text>
                      <Text variant='titleMedium'
                        style={[
                          styles.timelineDateDay,
                          isToday ? styles.timelineDateDayToday : {},
                          isSelected ? styles.timelineDateDaySelected : {},
                        ]}
                        >
                        {date.day}
                      </Text>
                    </>
                  </TouchableRipple>
                </Surface>
              )
            })}
          </View>
        </ScrollView>
        <ScrollView style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle} variant='labelMedium'>MEASUREMENTS</Text>
            <Button mode='text'
              textColor={theme.colors.onSurface}
              onPress={() => {
                const nextExpandedMeasurements = new Set(areAllMeasurementsExpanded ? [] : displayedMeasurementIds);
                setExpandedMeasurements(nextExpandedMeasurements);
              }}
            >
              <Text variant='labelMedium' style={{ marginLeft: 4 }}>{areAllMeasurementsExpanded ? 'COLLAPSE' : 'EXPAND'} ALL</Text>
            </Button>
            {displayedMeasurements.length ? (
              <View style={styles.dailyMeasurementsStatusContainer}>
                {selectedWeekDates.map((date, index) => {
                  const isSelected = index === selectedDate.getDayOfWeek();
                  const isFuture = date.after(today);
                  const nonComboMeasurementsCount = displayedMeasurements.filter(({ type }) => type !== 'combo').length;
                  const nonNullRecordingCount = [...selectedWeekMeasurementValues.entries()].filter(([measurementId, recordings]) => {
                    const isCombo = displayedMeasurements.find(({ id }) => id === measurementId)?.type === 'combo';
                    return !isCombo && recordings[index] !== null;
                  }).length;
                  return (
                    <View
                      key={date.toString()}
                      style={[
                        styles.timelineDateIcon,
                      ]}
                     >
                      {isFuture ? (
                        <Icon source={'circle-small'} size={20} color={isSelected ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
                      ) : (
                        <Icon
                          source={nonNullRecordingCount ? Icons.progressPartial(nonNullRecordingCount / nonComboMeasurementsCount) : Icons.progressNone}
                          size={20}
                          color={!isSelected ? theme.colors.onSurfaceDisabled : theme.colors.onSurface}
                        />
                      )}
                  </View>
                  )
                })}
              </View>
            ) : null}
          </View>
          <View style={styles.sectionContent}>
            {
              displayedMeasurements.length ? displayedMeasurements.map((measurement, index) => {
                const { id } = measurement;
                return (
                  <RecordingMeasurementItem
                    key={id}
                    index={index}
                    measurement={measurement}
                    date={selectedDate}
                    weekMeasurementValues={selectedWeekMeasurementValues.get(measurement.id) || []}
                    expanded={displayedExpandedMeasurements.has(id)}
                    onValueChange={(nextValue: number) => queueRecordingUpdate(nextValue, id, selectedDate.toString())}
                    onPress={() => {
                      const nextExpandedMeasurements = new Set([...expandedMeasurements]);
                      nextExpandedMeasurements.has(id) ? nextExpandedMeasurements.delete(id) : nextExpandedMeasurements.add(id);
                      setExpandedMeasurements(nextExpandedMeasurements);
                    }}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle} variant='labelMedium'>HABITS</Text>
            <Button mode='text'
              textColor={theme.colors.onSurface}
              onPress={() => {
                const nextExpandedHabits = new Set(areAllHabitsExpanded ? [] : displayedHabitIds);
                setExpandedHabits(nextExpandedHabits);
              }}
            >
              <Text variant='labelMedium' style={{ marginLeft: 4 }}>{areAllHabitsExpanded ? 'COLLAPSE' : 'EXPAND'} ALL</Text>
            </Button>
            {displayedHabits.length ? (
              <>
                <View style={styles.progressContainer}>
                  <View style={styles.weekProgressBar}>
                    <ProgressBar
                      progress={(selectedWeekPointTotal) / weekProgressTarget || 0}
                      style={styles.baseProgress}
                      color={theme.colors.elevation.level1}
                    />
                  </View>
                  <View style={styles.weekProgressBar}>
                    <ProgressBar
                      progress={(selectedWeekPointTotal) / weekProgressTarget || 0}
                      style={styles.overlapProgress}
                      color={theme.colors.onSurfaceDisabled}
                    />
                  </View>
                  <View style={styles.weekProgressBar}>
                    <ProgressBar
                      progress={selectedDateCumulativePointTotal / weekProgressTarget || 0}
                      style={styles.overlapProgress}
                      color={theme.colors.onSurface}
                    />
                  </View>
                  <View style={styles.weekProgressBar}>
                    <ProgressBar
                      progress={(selectedDateCumulativePointTotal - selectedDatePointTotal) / weekProgressTarget || 0}
                      style={styles.overlapProgress}
                      color={theme.colors.elevation.level1}
                    />
                  </View>
                  <View style={styles.weekProgressBar}>
                    <ProgressBar
                      progress={(selectedDateCumulativePointTotal - selectedDatePointTotal) / weekProgressTarget || 0}
                      style={styles.overlapProgress}
                      color={theme.colors.onSurfaceDisabled}
                    />
                  </View>
                </View>
                <View style={styles.weekPointsContainer}>
                  <Text style={styles.weekPointsLabel}>Week:</Text>
                  <Text variant='titleMedium'>{selectedWeekPointTotal}</Text>
                  {/* <Points size={'medium'} points={selectedWeekPointTotal} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} /> */}
                  <Text style={styles.weekPointsDivider}>/</Text>
                  <Points size={'medium'} points={perWeekPointTarget} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
                  {/* <Text style={styles.weekPointsTarget}> / week</Text> */}
                </View>
                <View style={styles.dailyPointTotalContainer}>
                  {selectedWeekDates.map((date, index) => {
                    const daily = selectedWeekDailyHabitPointTotals[index] || 0;
                    const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
                    const total = daily + weekly;
                    const isSelected = index === selectedDate.getDayOfWeek();
                    const isFuture = date.after(today);
                    
                    const color = isSelected ? theme.colors.onSurface : theme.colors.onSurfaceDisabled;
                    return (
                      <TouchableRipple
                        key={date.toString()}
                        style={[styles.dailyPoints, isSelected ? styles.dailyPointsSelected : {}]}
                        onPress={() => setSelectedDate(date)}
                      >
                        <>
                          <Text variant='bodySmall' style={{ ...styles.dailyPointDayOfWeek, color }}>{date.getDayOfWeekLabel().toUpperCase()}</Text>
                          {isFuture ? (
                            <Icon source={'circle-small'} size={20} color={color} />
                          ) : (
                            <Points
                              style={styles.dailyPointTotal}
                              points={total}
                              size='small'
                              disabled={!isSelected}
                            />
                          )}
                        </>
                      </TouchableRipple>
                    )
                  })}
                </View>
              </>
            ) : null}
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.recordingView}>
              {
                displayedHabits.length ? displayedHabits.map((habit, index) => {
                  const { id } = habit;
                  return (
                    <RecordingDataHabit
                      key={habit.id}
                      index={index}
                      habit={habit}
                      date={selectedDate}
                      weekDates={selectedWeekDates}
                      measurements={measurements}
                      expanded={expandedHabits.has(id)}
                      recordingData={mergedRecordingsMap}
                      onPress={() => {
                        const nextExpandedHabits = new Set([...expandedHabits]);
                        nextExpandedHabits.has(id) ? nextExpandedHabits.delete(id) : nextExpandedHabits.add(id);
                        setExpandedHabits(nextExpandedHabits);
                      }}
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
  timelineContainer: {
    position: 'relative',
    backgroundColor: theme.colors.elevation.level3,
    flexGrow: 0,
    flexShrink: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  timelineHeaderButton: {
    margin: 0,
  },
  timeHeaderText: {
    flexGrow: 1,
    textAlign: 'center',
    // color: theme.colors.outline,
  },
  timelineContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    paddingHorizontal: 16,
    
  },
  timelineDate: {
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    borderRadius: 16,
    gap: 8,
  },
  timelineDateToday: {
  },
  timelineDateSelected: {
  },
  timelineDateContent: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 2,
    
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 4,
    
    borderColor: 'transparent',
  },
  timelineDateContentToday: {
    paddingVertical: 11,
    paddingHorizontal: 1,
    borderWidth: 1,
    borderColor: theme.colors.surfaceDisabled,
  },
  timelineDateContentSelected: {
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderWidth: 0,
    backgroundColor: theme.colors.surfaceDisabled,
  },
  timelineDateDayOfWeek: {
    textAlign: 'center',
    color: theme.colors.onSurfaceDisabled,
    fontSize: 14,
  },
  timelineDateDayOfWeekToday: {
    
  },
  timelineDateDayOfWeekSelected: {
    color: theme.colors.onSurface,
  },
  timelineDateDay: {
    textAlign: 'center',
    color: theme.colors.onSurfaceDisabled,
    fontSize: 18,
    lineHeight: 24,
  },
  timelineDateDayToday: {

  },
  timelineDateDaySelected: {
    color: theme.colors.onSurface,
  },
  timelineDateIcon: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    borderRadius: 8,
  },
  weekProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlapProgress: {
    height: '100%',
    borderRadius: 8,
    flexGrow: 0,

    backgroundColor: 'transparent',
  },
  baseProgress: {
    height: '100%',
    borderRadius: 8,
    flexGrow: 0,

    backgroundColor: theme.colors.surfaceDisabled,
  },
  weekPointsContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  weekPointsLabel: {},
  weekPointsDivider: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  weekPointsTarget: {
    fontSize: 16,
    lineHeight: 28,
    color: theme.colors.onSurface,
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
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: theme.colors.elevation.level3,
  },
  sectionHeaderIcon: {
    marginLeft: 8
  },
  sectionHeaderTitle: {
    marginLeft: 12,
    borderRadius: 16,
    flex: 1,
  },
  sectionContent: {
  },
  recordingView: {
    
  },
  recordingDivider: {
    marginVertical: 24,
  },
  dailyMeasurementsStatusContainer: {
    width: '100%',
    // paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16,
  },
  dailyPointTotalContainer: {
    width: '100%',
    // paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16,
  },
  dailyPoints: {
    paddingVertical: 8,
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    gap: 2,
    borderRadius: 16,
  },
  dailyPointsSelected: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  dailyPointDayOfWeek: {
    
  },
  dailyPointTotal: {
    justifyContent: 'center',
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

export default RecordingsScreen;

type RecordingMeasurementItemProps = {
  index: number,
  measurement: Measurement,
  date: SimpleDate,
  weekMeasurementValues: (number | null)[],
  expanded: boolean,
  onValueChange: (nextValue: number) => void,
  onPress: (id: string) => void,
}

const RecordingMeasurementItem = ({ index, measurement, date: currentDate, weekMeasurementValues, expanded, onValueChange, onPress } : RecordingMeasurementItemProps) : JSX.Element | null  => {
  const theme = useTheme();
  const typeData = getMeasurementTypeData(measurement.type);
  if (!typeData) return null;
  
  const isDuration = measurement.type === 'duration';
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

  const styles = createMeasurementStyles(theme, index);
  const renderControlContent = () => {
    if (isBool) {
      return (
        <>
          <Text style={styles.value} variant='titleMedium'> </Text>
          <View style={styles.controls}>
            <IconButton
              style={styles.controlButton} size={18} mode={value === 0 ? 'contained' : undefined} iconColor={theme.colors.onSurface} icon='window-close' onPress={() => {
              onValueChange(0);
            }}/>
            <IconButton
              style={styles.controlButton} size={18} mode={value ? 'contained' : undefined} iconColor={theme.colors.onSurface} icon='check' onPress={() => {
              onValueChange(1);
            }}/>
          </View>
        </>
      );
    } else {
      const valueString = formatValue(value, measurement.type, measurement.unit, true);
      return (
        <>
          <Text style={styles.value} variant='titleMedium'>{valueString}</Text>
          {isCombo ? <View style={{ ...styles.controls, marginRight: 0 }} /> : (
            <View style={styles.controls}>
              <IconButton
                style={styles.controlButton}
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
                style={styles.controlButton}
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
            </View>
          )}
        </>
      )
    }
  }

  const renderExpandedContent = () => {
    const total = weekMeasurementValues.reduce((acc: number, curr) => acc + (curr || 0), 0);
    const totalString = formatValue(total, isBool ? 'count' : measurement.type, measurement.unit, true);
    const count = weekMeasurementValues.reduce((acc: number, curr) => acc + (curr === null ? 0 : 1), 0);
    const average = count === 0 ? null : total / count;
    const averageString = formatValue(average, isBool ? 'count' : measurement.type, measurement.unit, true);
    return expanded && [
      !isCombo && (
        <View key={'completion'} style={styles.completionContent}>
          <View style={styles.completionStatuses}>
            {weekMeasurementValues.map((value, index) => {
              const date = currentDate.getDaysAgo(currentDate.getDayOfWeek() - index);
              const isFuture = date.after(SimpleDate.today());
              const isSelected = index === currentDate.getDayOfWeek();
              return (
                <View key={date.toString()} style={styles.completionStatus}>
                  {isFuture ? (
                    <Icon source={'circle-small'} size={20} color={isSelected ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
                  ) : (
                  <Icon
                    source={value === null ? Icons.progressNone : Icons.progressComplete}
                    size={14}
                    color={isSelected ? theme.colors.onSurface : theme.colors.onSurfaceDisabled}
                  />)}
                </View>
              );
            })}
          </View>
        </View>
      ),
      (
        <View key={'aggregate'} style={styles.aggregateContent}>
          {isTime ? null : (<View style={styles.aggregateMetric}>
            <Text variant='bodyMedium' style={styles.aggregateMetricLabel}>
              Total:
            </Text>
            <Text variant='titleSmall' style={styles.aggregateMetricValue}>
              {count ? totalString : '--'}
            </Text>
          </View>)}
          <View style={styles.aggregateMetric}>
            <Text variant='bodyMedium' style={styles.aggregateMetricLabel}>
              Average:
            </Text>
            <Text variant='titleSmall' style={styles.aggregateMetricValue}>
              {count ? averageString : '--'}
            </Text>
          </View>
        </View>
      ),
    ];
  }


  return (
    <TouchableRipple
      style={styles.container}
      onPress={() => onPress(measurement.id)}
    >
      <>
        <View style={styles.content}>
          <View style={styles.typeIconContainer}>
            <Icon source={typeData.icon} size={20} />
          </View>
          <View style={styles.label}>
            <Text numberOfLines={1} ellipsizeMode="tail" variant='titleMedium' style={styles.labelActivity}>{measurement.name}</Text>
            {measurement.variant ? (
              <>
                <Text variant='bodyLarge' style={styles.labelDivider}> : </Text>
                <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={[styles.labelVariant]}>{measurement.variant}</Text>
              </>
            ) : null}
          </View>
          {renderControlContent()}
        </View>
        {renderExpandedContent()}
      </>
    </TouchableRipple>
  );
}

const createMeasurementStyles = (theme: MD3Theme, index: number) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderColor: theme.colors.surfaceVariant,
    borderBottomWidth: 1,
    borderTopWidth: index ? 0 : 1,
    gap: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    gap: 8,
  },
  typeIconContainer: {
    marginLeft: 8,
  },
  label: {
    flexGrow: 0,
    flexDirection: 'row',
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
  value: {
    flexGrow: 1,
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  valueLabel: {
    flexShrink: 0,
    marginLeft: 6,
    textAlign: 'right',
  },
  controls: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    margin: 0,
    marginHorizontal: -4,
    marginVertical: -4,
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  expandedContent: {
    gap: 8,
  },
  completionContent: {
  },
  completionStatuses: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 16,
  },
  completionStatus: {
    height: 20,
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aggregateContent: {
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
  },
  aggregateMetric: {
    flexDirection: 'row',
    gap: 6,
  },
  aggregateMetricLabel: {

  },
  aggregateMetricValue: {

  },
});

type RecordingDataHabitProps = {
  habit: ComputedHabit,
  index: number,
  date: SimpleDate,
  weekDates: SimpleDate[],
  measurements: Measurement[],
  expanded: boolean,
  recordingData:  Map<string, Map<string, number>>,
  onPress: (id: string) => void,
}

const RecordingDataHabit = (props : RecordingDataHabitProps) : JSX.Element | null => {
  const { habit, index, date, weekDates, measurements, expanded, recordingData, onPress } = props;

  const theme = useTheme();
  const styles = createHabitStyles(theme, index);

  const today = SimpleDate.today();
  const isFuture = date.after(SimpleDate.today());
  const dayRecordings = getDateRecordings(measurements, date);
  const weekRecordings = weekDates.map((weekDate) => getDateRecordings(measurements, weekDate));

  const firstWeeklyCompletionIndex = habit.isWeekly ? range(0, 7).map((_, index) => {
    const [complete] = getHabitCompletion(habit, measurements, weekDates.slice(0, index + 1), recordingData);
    return complete;
  }).findIndex((completion) => completion) : -1;

  const renderCompletionContent = () => (
    <View style={styles.completionContent}>
      {weekDates.map((weekDate, index) => {
        const dates = habit.isWeekly ? weekDates : [weekDate];
        const [complete] = getHabitCompletion(habit, measurements, dates, recordingData);
        
        const isSelected = index === date.getDayOfWeek();
        const isFuture = weekDate.after(today);
        let source = 'window-close';
        let color = theme.colors.onSurfaceDisabled;
        let size = 14;
        if (isFuture) {
          source = 'circle-small';
          size = 20;
        } else if (habit.isWeekly && firstWeeklyCompletionIndex !== -1) {
          if (index === firstWeeklyCompletionIndex) {
            source = 'check-bold';
          } else if (index > firstWeeklyCompletionIndex) {
            source = 'circle-small';
            size = 20;
          }
        } else if (complete) {
          source = 'check-bold';
        }
        
        if (isSelected) {
          color = theme.colors.onSurface;
        }
      
        return (
          <View
            key={weekDate.toString()}
            style={styles.completionIcon}
          >
            <Icon source={source} size={size} color={color} />
          </View>
        );
      })}
    </View>
  );

  const dates = weekDates.slice(habit.isWeekly ? 0 : date.getDayOfWeek(), date.getDayOfWeek() + 1);
  const [complete, conditionCompletions, conditionValues, conditionProgressions] = getHabitCompletion(habit, measurements, dates, recordingData);
  const renderConditionContent = () => {
    return (
      <View style={styles.conditionContent}>
        {habit.conditions.map(({ target, measurementId, operator }, index) => {
          const measurement = measurements.find(({ id }) => id === measurementId);
          if (!measurement) return null;

          const isBool = measurement.type === 'bool';

          const conditionCompletion = conditionCompletions[index];
          const conditionValue = conditionValues[index];
          const conditionProgress = conditionProgressions[index];

          const valueString = conditionValue === null ? '-' : formatValue(conditionValue, measurement.type);
          const targetString = formatValue(target, measurement.type, measurement.unit, true);

          const progressLabelColor = theme.colors.onSurface;
          const progressColor = conditionCompletion ? theme.colors.onSurface : theme.colors.onSurfaceDisabled;
          return (
            <View key={`${measurementId}${operator}${target}`} style={styles.condition}>
              <View style={styles.conditionMeasurement}>
                <Icon source={getMeasurementTypeIcon(measurement.type)} size={14} />
                <Text variant='labelLarge'>{measurement.name}</Text>
                {measurement.variant ? (
                  <>
                    <Text variant='bodyMedium'>:</Text>
                    <Text variant='bodyMedium'>{measurement.variant}</Text>
                  </>
                ) : null}

              </View>
              <View style={styles.conditionProgressLabel}>
                {isBool && conditionValue !== null ? (
                  <Icon
                    source={conditionValue ? 'check' : 'window-close'}
                    size={16}
                  />
                ) : (
                  <Text style={{ ...styles.conditionProgressCurrent, color: progressLabelColor }} variant='labelLarge'>
                    {valueString}
                  </Text>
                )}
                <Text style={{ ...styles.conditionProgressDivider, color: progressLabelColor }} variant='bodyMedium'>
                  {' / '}
                </Text>
                {isBool ? (
                  <Icon
                    source={operator === '==' ? 'check' : 'window-close'}
                    size={16}
                  />
                ) : (
                  <Text style={{ ...styles.conditionProgressTarget, color: progressLabelColor }} variant='bodyMedium' numberOfLines={1}>
                    {targetString}
                  </Text>
                )}
              </View>
              <View style={styles.conditionProgress}>
                <ProgressBar
                  style={[styles.conditionProgressBar, conditionCompletion ? styles.conditionProgressBarComplete : {}]}
                  progress={conditionProgress || 0}
                  color={progressColor}
                />
                {/* {habit.conditions.length === 1 ? (
                  <Points style={{ marginLeft: 4 }} points={habit.points} disabled={!complete} />
                ) : (
                  <View style={[styles.completionIcon, conditionCompletion ? styles.completionIconComplete : {}]}>
                    <Icon
                      source={conditionCompletion ? 'check' : 'window-close'}
                      color={conditionCompletion ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled}
                      size={16}
                    />
                  </View>
                )} */}
              </View>
            </View>
          );
        })}
      </View>
    )
  }
  // }
  //  else {
  //   const dates = weekDates.slice(habit.isWeekly ? 0 : date.getDayOfWeek(), date.getDayOfWeek() + 1);
  //   const [complete, conditionCompletions, conditionValues, conditionProgressions] = getHabitCompletion(habit, measurements, dates, recordingData);

  //   const predicateColor = complete ? theme.colors.primary : theme.colors.onSurfaceDisabled;
  
  //   content = (
  //     <>
  //       <View style={habitStyles.progressContainers}>
  //         {habit.conditions.length === 1 ? null : (
  //           <View style={habitStyles.multipleConditionContainer}>
  //             <View style={habitStyles.predicateContainer}>
  //               <Icon source={getHabitPredicateIcon(habit.predicate)} size={14} color={predicateColor} />
  //               <Text style={{ ...habitStyles.predicate, color: predicateColor}} variant='titleSmall'>{getHabitPredicateLabel(habit.predicate)}</Text>
  //             </View>
  //             <Points points={habit.points} disabled={!complete} />
  //           </View>
  //         )}
  //         {habit.conditions.map(({ target, measurementId, operator }, index) => {
  //           const measurement = measurements.find(({ id }) => id === measurementId);
  //           if (!measurement) return null;

  //           const conditionCompletion = conditionCompletions[index];
  //           const conditionValue = conditionValues[index];
  //           const conditionProgress = conditionProgressions[index];
            
  //           const isBool = measurement.type === 'bool';

  //           const progressLabelColor = theme.colors.onSurface;
  //           const progressColor = conditionCompletion ? theme.colors.primary : theme.colors.onSurfaceDisabled;
            
  //           const valueString = conditionValue === null ? '-' : formatValue(conditionValue, measurement.type);
  //           return (
  //             <Fragment key={`${measurementId}${target}`}>
  //               <View style={habitStyles.progressContainer}>
  //                 <View style={habitStyles.progressBarContainer}>
  //                   <ProgressBar
  //                     style={[habitStyles.progressBar, conditionCompletion ? habitStyles.progressBarComplete : {}]}
  //                     progress={conditionProgress || 0}
  //                     color={progressColor}
  //                   />
  //                 </View>
  //                 <View style={habitStyles.progressLabel}>
  //                   {isBool && conditionValue !== null ? (
  //                     <Icon
  //                       source={conditionValue ? 'check' : 'window-close'}
  //                       size={16}
  //                     />
  //                   ) : (
  //                     <Text style={{ ...habitStyles.progressLabelCurrent, color: progressLabelColor }} variant='labelLarge'>
  //                       {valueString}
  //                     </Text>
  //                   )}
  //                   <Text style={{ ...habitStyles.progressLabelDivider, color: progressLabelColor }} variant='bodyMedium'>
  //                     {' / '}
  //                   </Text>
  //                   {isBool ? (
  //                     <Icon
  //                       source={operator === '==' ? 'check' : 'window-close'}
  //                       size={16}
  //                     />
  //                   ) : (
  //                     <Text style={{ ...habitStyles.progressLabelTarget, color: progressLabelColor }} variant='bodyMedium' numberOfLines={1}>
  //                       {formatValue(target, measurement.type, measurement.unit, true)}
  //                     </Text>
  //                   )}
  //                 </View>
  //                 {habit.conditions.length === 1 ? (
  //                   <Points style={{ marginLeft: 4 }} points={habit.points} disabled={!complete} />
  //                 ) : (
  //                   <View style={[habitStyles.completionIcon, conditionCompletion ? habitStyles.completionIconComplete : {}]}>
  //                     <Icon
  //                       source={conditionCompletion ? 'check' : 'window-close'}
  //                       color={conditionCompletion ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled}
  //                       size={16}
  //                     />
  //                   </View>
  //                 )}
  //               </View>
  //             </Fragment>
  //           )
  //         })}
  //       </View>
  //     </>
  //   );
  // }

  return (
    <TouchableRipple
      style={styles.container}
      onPress={() => onPress(habit.id)}
    >
      <>
        <View style={styles.content}>
          <Text variant='titleMedium'>{habit.name}</Text>
          <View style={styles.scopeTag}>
            <Text variant='bodySmall' style={styles.scopeTagText}>
              {habit.isWeekly ? 'WEEKLY' : `DAILY x${habit.daysPerWeek}`}
            </Text>
          </View>
          {isFuture ? null : (
            <View style={styles.dayCompletion}>
              {habit.conditions.length > 1 && (
                <View style={styles.predicate}>
                  <Icon source={getHabitPredicateIcon(habit.predicate)} size={14} color={complete ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
                  <Text style={[styles.predicateLabel, complete ? styles.predicateLabelComplete : {}]} variant='bodyLarge'>{getHabitPredicateLabel(habit.predicate)}</Text>
                </View>
              )}
              {habit.conditions.map((condition, index) => {
                const conditionCompletion = conditionCompletions[index];
                return (
                  <View key={condition.measurementId} style={[styles.dayCompletionIcon, conditionCompletion ? styles.dayCompletionIconComplete : {}]}>
                    <Icon
                      source={conditionCompletion ? 'check' : 'window-close'}
                      color={complete ? theme.colors.onSurface : theme.colors.onSurfaceDisabled}
                      size={16}
                    />
                  </View>
                )
              })}
              <Points style={styles.dayCompletionPoints} size='medium' points={habit.points} color={complete ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
            </View>
          )}
          {/* {scope === 'day' ? (
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
          ) : null} */}
        </View>
        {expanded && (
          <>
            {renderCompletionContent()}
            {renderConditionContent()}
          </>
        )}
      </>
    </TouchableRipple>
  );
}

const createHabitStyles = (theme: MD3Theme, index: number) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderColor: theme.colors.surfaceVariant,
    borderBottomWidth: 1,
    borderTopWidth: index ? 0 : 1,
    gap: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  scopeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceDisabled,
    borderRadius: 10,
  },
  scopeTagText: {
    color: theme.colors.outline,
  },
  dayCompletion: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  dayCompletionIcon: {},
  dayCompletionIconComplete: {},
  dayCompletionPoints: {
    marginLeft: 12,
  },
  predicate: {
    flexDirection: 'row',
    alignItems: 'center',  
    gap: 4,
  },
  predicateLabel: {
    color: theme.colors.onSurfaceDisabled,
    textTransform: 'uppercase',
  },
  predicateLabelComplete: {
    color: theme.colors.onSurface,
  },
  conditionContent: {
    paddingHorizontal: 8,
  },
  condition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 4,
    paddingVertical: 4,
  },
  conditionMeasurement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conditionProgress: {
    width: '100%',
  },
  // progressContainers: {
  //   height: '100%',
  //   width: '50%',
  //   flexGrow: 0,
  //   flexDirection: 'column',
  //   marginLeft: 8,
  //   justifyContent: 'flex-end',
  //   alignItems: 'flex-end',
  // },
  // multipleConditionContainer: {
  //   flexDirection: 'row',
  //   width: '100%',
  //   justifyContent: 'flex-end',
  //   alignItems: 'center',
  // },
  // progressContainer: {
  //   width: '100%',
  //   flexGrow: 0,
  //   flexDirection: 'row',
  //   alignItems: 'flex-start',
  //   marginTop: 6,
  //   paddingVertical: 3,
  // },
  // progressBarContainer: {
  //   flex: 1,
  //   position: 'relative',
  //   flexDirection: 'row',
  //   // alignItems: 'flex-start',
  // },
  conditionProgressBar: {
    height: 6,
    borderRadius: 200,
    // borderWidth: 2,
    // borderColor: 'transparent',
    // backgroundColor: 'transparent',
  },
  conditionProgressBarComplete: {
    // borderColor: theme.colors.primary,
  },
  conditionProgressLabel: {
    // position: 'absolute',
    // top: 9,
    // right: 38,
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  conditionProgressCurrent: {
    flex: 1,
    textAlign: 'right',
  },
  conditionProgressDivider: {
    marginHorizontal: 1,
  },
  conditionProgressTarget: {

  },
  progressLabelIcon: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  completionIconComplete: {
    // backgroundColor: theme.colors.primary,
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16,
  },
  completionIcon: {
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  checkbox: {
    
  },
});
