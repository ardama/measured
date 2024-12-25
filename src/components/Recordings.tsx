import { Dimensions, FlatList, PixelRatio, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useComputedHabits, useHabitStatus, useMeasurements, useMeasurementStatus } from '@s/selectors';
import { getMeasurementRecordingValue, getMeasurementStartDate, getMeasurementTypeData, type Measurement } from '@t/measurements';
import { Button, Divider, Icon, IconButton, ProgressBar, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimpleDate } from '@u/dates';
import Header from '@c/Header';
import { getHabitCompletion, getHabitPredicateIcon, getHabitPredicateLabel, type ComputedHabit } from '@t/habits';
import { formatNumber, formatValue, forWeb, intersection, range, triggerHaptic } from '@u/helpers';
import Points from '@c/Points';
import { Icons } from '@u/constants/Icons';
import { callUpdateHabits, callUpdateMeasurements } from '@s/dataReducer';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import BottomDrawer, { type BottomDrawerItem } from '@c/BottomDrawer';
import { NestableDraggableFlatList, NestableScrollContainer, ScaleDecorator } from 'react-native-draggable-flatlist';
import Status from '@u/constants/Status';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { type Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { measure, runOnJS, runOnRuntime, runOnUI, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import useDimensions from '@u/hooks/useDimensions';
import useGlobalStyles from '@u/hooks/useGlobalStyles';
import { createFontStyle } from '@u/styles';

const Recordings = () => {
  const theme = useTheme();
  const { basePalette, globalPalette, getCombinedPalette } = usePalettes();
  const styles = createStyles(theme, globalPalette);
  const globalStyles = useGlobalStyles(theme);

  const measurements = useMeasurements();

  const habits = useComputedHabits();
  const activeHabits = habits.filter((h) => !h.archived);
  const dailyHabits = activeHabits.filter((h) => !h.isWeekly)
  const weeklyHabits = activeHabits.filter((h) => h.isWeekly);

  const today = SimpleDate.today();
  
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedDayOfWeek = selectedDate.getDayOfWeek();
  const selectedWeekDates = SimpleDate.generateWeek(selectedDate);
  const isToday = selectedDate.equals(today);

  const handleSelectedDateChange = (date: SimpleDate) => {
    setSelectedDate(date);
    
    if (!flatListRef.current) return;
    flatListRef.current.scrollToIndex({ index: 52, animated: false});
  }

  const flatListRef = useAnimatedRef<FlatList<{ dates: SimpleDate[]}>>();
  const weeks = useMemo(() => range(-52, 53).map((i) => ({ dates: SimpleDate.generateWeek(today.getDaysAgo(-7 * i)) })), [today]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / timelineWidth);
    const nextSelectedDate = weeks[index].dates[selectedDayOfWeek];
    setSelectedDate(nextSelectedDate);
  }, [weeks])

  const { window: dimensions } = useDimensions();
  const timelineWidth = PixelRatio.roundToNearestPixel(dimensions.width);
  const timelineFlatList = (
    <FlatList
      style={{ width: timelineWidth, flexShrink: 0 }}
      ref={flatListRef}
      data={weeks}
      keyExtractor={( item ) => item.dates[0].toString()}
      pagingEnabled
      horizontal
      initialScrollIndex={52}
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={32}
      onScroll={Platform.select({ web: handleScroll, default: handleScroll })}
      getItemLayout={(_, index) => ({
        length: timelineWidth,
        offset: timelineWidth * index,
        index,
      })}
      renderItem={({ item }) => {
        // return (
        //   <View style={[styles.timelineContainer, { width: timelineWidth }]}>
        //     <Text variant='bodyMedium' style={styles.timeHeaderText}>
        //       {selectedWeekDates[0].toFormattedString()} - {selectedWeekDates[6].toFormattedString()}
        //     </Text>
        //     <View style={styles.dailyPointTotalContainer}>
        //       {selectedWeekDates.map((date, index) => {
        //         const isToday = date.toString() === today.toString();
        //         const daily = selectedWeekDailyHabitPointTotals[index] || 0;
        //         const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
        //         const total = daily + weekly;
        //         const isSelected = index === selectedDayOfWeek;
        //         const isFuture = date.after(today);

        //         const isNullRecordings = measurementsWithStartDates.filter(([_, startDate]) => !startDate.after(date)).map(([measurement]) => {
        //           const recordings = selectedWeekMeasurementValues.get(measurement.id);
        //           return !recordings || !recordings.length || recordings[index] === null;
        //         });

        //         const nullRecordingCount = isNullRecordings.filter((value) => value).length;
        //         const nonNullRecordingCount = isNullRecordings.length - nullRecordingCount;
        //         const noMeasurements = isNullRecordings.length === 0;
        //         const measurementCompletion = noMeasurements || isFuture ? 0 : nonNullRecordingCount / isNullRecordings.length;
                                  
        //         const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
        //         return (
        //           <TouchableRipple
        //             key={date.toString()}
        //             style={[
        //               styles.dailyPoints,
        //               // isSelected ? styles.dailyPointsSelected : {},
        //               isToday ? styles.dailyPointsToday : {},
        //             ]}
        //             onPress={() => handleSelectedDateChange(date)}
        //           >
        //             <>
        //               <View style={[styles.dailyPointsContainer, isToday ? styles.dailyPointsContainerToday : {}, isSelected ? styles.dailyPointsContainerSelected : {}]}>
        //                 {/* <Text variant='titleMedium'
        //                   style={[
        //                     styles.timelineDateDay,
        //                     isToday && styles.timelineDateDayToday,
        //                     isSelected && styles.timelineDateDaySelected,
        //                   ]}
        //                 >
        //                   {date.day}
        //                 </Text> */}
        //                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        //                   <Text variant='bodySmall' style={{ ...styles.dailyPointDayOfWeek, color }}>{date.getDayOfWeekLabel().toUpperCase()}</Text>
        //                   <Icon
        //                     source={(isFuture || isNullRecordings.length === 0) ? Icons.indeterminate : measurementCompletion === 0 ? Icons.progressNone : Icons.progressPartial(measurementCompletion)}
        //                     size={10}
        //                     color={color}
        //                   />
        //                 </View>
        //                 {isFuture ? (
        //                   <View style={{ padding: 4 }}>
        //                     <Icon source={Icons.indeterminate} size={16} color={color} />
        //                   </View>
        //                 ) : (
        //                   <Points
        //                     style={styles.dailyPointTotal}
        //                     points={total}
        //                     size='medium'
        //                     disabled={!isSelected}
        //                     color={color}
        //                   />
        //                 )}
        //               </View>
        //             </>
        //           </TouchableRipple>
        //         )
        //       })}
        //     </View>
        //     {displayedHabits.length ? (
        //       <>
        //         {!!perWeekPointTarget &&
        //           <View style={styles.pointsProgressContainer}>
        //             {!today.after(selectedWeekDates[6]) && !today.before(selectedWeekDates[0]) && (
        //               <View style={styles.pointsProgressTargetOuter}>
        //                 <View style={{ flexGrow: daysThisWeek }} />
        //                 <View style={styles.pointsProgressTarget}>
        //                   <View style={styles.pointsProgressTargetInner} />
        //                 </View>
        //                 <View style={{ flexGrow: 7 - daysThisWeek }} />
        //               </View>
        //             )}
        //             {selectedWeekDates.map((date, index) => {
        //               const dailyPoints = selectedWeekDailyHabitPointTotals[index];
        //               const weeklyPoints = selectedWeekWeeklyHabitPointTotals[index];
                      
        //               const isFuture = date.after(today);
        //               const isSelected = date.equals(selectedDate);
        //               const backgroundColor = isSelected ? globalPalette.primary : globalPalette.alt;
        //               return isFuture ? null : (
        //                 <View key={date.toString()} style={[styles.pointsProgressBar, { flexGrow: dailyPoints + weeklyPoints }]}>
        //                   <View style={[styles.pointsProgressBarEnd, { left: -2, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]} />
        //                   <View style={[styles.pointsProgressBarEnd, { right: -2 }]} />
        //                   <View style={[styles.pointsProgressBarInner, { backgroundColor }]} />
        //                 </View>
        //               );
        //             })}
        //             <View style={{
        //               flexDirection: 'row',
        //               flexBasis: 8,
        //               flexGrow: Math.max(0, perWeekPointTarget - selectedWeekPointTotal),
        //               justifyContent: 'flex-end',
        //               alignItems: 'center',
        //             }}>
        //               {/* <View style={{
        //                 flexGrow: 1,
        //                 height: 8,
        //                 borderRadius: 8,
        //                 backgroundColor: theme.colors.surfaceDisabled,
        //               }} /> */}
        //             </View>
        //           </View>
        //         }
        //         <View style={styles.weekPointsContainer}>
        //           <Text variant='bodySmall' style={styles.weekPointsLabel}>Total</Text>
        //           <Text variant='titleSmall'>{selectedWeekPointTotal}</Text>
        //           <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
        //           <Points size={'small'} points={perWeekPointTarget} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
        //           <View style={{ flexGrow: 1 }} />
        //           <Text variant='bodySmall' style={[styles.weekPointsLabel, { marginLeft: 16 }]}>Average</Text>
        //           <Text variant='titleSmall'>{formatNumber(selectedWeekPointTotal / daysThisWeek, 1)}</Text>
        //           <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
        //           <Points size={'small'} points={perWeekPointTarget / 7} decimals={1} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
        //         </View>
        //       </>
        //     ) : null}
        //   </View>
        // )
        
        return (
          <View style={[styles.timelineContent, { width: timelineWidth }]}>
            {item.dates.map((date) => {
              const dayOfWeek = date.getDayOfWeekLabel();
              const isSelected = date.getDayOfWeek() === selectedDayOfWeek;
              const isToday = date.equals(today);

              return (
                <View
                  key={date.toString()}
                  style={[
                    styles.timelineDate,
                    isToday && styles.timelineDateToday,
                    // isSelected && globalStyles.elevation1,
                    isSelected && styles.timelineDateSelected,
                  ]}
                >
                  <Pressable
                    onPress={() => handleSelectedDateChange(date)}
                    style={[
                      styles.timelineDateContainer,
                      isToday && styles.timelineDateContainerToday,
                      isSelected && styles.timelineDateContainerSelected,
                    ]}
                  >
                    <>
                      <View
                        style={[
                          styles.timelineDateContent,
                          isToday && styles.timelineDateContentToday,
                          isSelected && styles.timelineDateContentSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timelineDateDayOfWeek,
                            isToday && styles.timelineDateDayOfWeekToday,
                            isSelected && styles.timelineDateDayOfWeekSelected,
                          ]}
                          >
                          {dayOfWeek.toUpperCase()}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', 'justifyContent': 'center'}}>
                          {isToday && <View
                            style={[
                              styles.todayIndicator,
                              isSelected && styles.todayIndicatorToday,
                            ]}
                          />}
                          <Text variant='titleMedium'
                            style={[
                              styles.timelineDateDay,
                              isToday && styles.timelineDateDayToday,
                              isSelected && styles.timelineDateDaySelected,
                            ]}
                          >
                            {date.day}
                          </Text>
                        </View>
                      </View>
                    </>
                  </Pressable>
                </View>
              )
            })}
          </View>
        )
      }}
    />
  )


  const [isMeasurementMenuVisible, setIsMeasurementMenuVisible] = useState(false);
  const [showArchivedMeasurements, setShowArchivedMeasurements] = useState(false);
  const [isReorderingMeasurements, setIsReorderingMeasurements] = useState(false);
  const [measurementPriorityOverrides, setMeasurementPriorityOverrides] = useState<string[] | null>(null);

  const orderedMeasurements = measurementPriorityOverrides?.length
  ? measurementPriorityOverrides
    .map((overrideId) => measurements.find(({ id }) => id === overrideId))
    .filter((m) => !!m)
  : measurements;

  const displayedMeasurements = orderedMeasurements
    .filter(m => !m.archived || showArchivedMeasurements);
  const [expandedMeasurements, setExpandedMeasurements] = useState(new Set());
  const displayedMeasurementIds = displayedMeasurements.map(({ id }) => id);
  const displayedExpandedMeasurements = intersection(expandedMeasurements, new Set(displayedMeasurementIds));
  const areAllMeasurementsExpanded = displayedExpandedMeasurements.size === displayedMeasurements.length;

  const submitMeasurementOrder = () => {
    if (!measurementPriorityOverrides || !measurementPriorityOverrides.length) return;

    const updatedMeasurements: Measurement[] = [];
    measurements.forEach((measurement) => {
      const nextPriority = measurementPriorityOverrides.findIndex((id) => id === measurement.id);
      if (measurement.priority === nextPriority) return;

      updatedMeasurements.push({ ...measurement, priority: nextPriority });
    });

    if (!updatedMeasurements.length) return;
    dispatch(callUpdateMeasurements(updatedMeasurements));
  }

  const measurementMenuItems: BottomDrawerItem<string>[] = [
    {
      icon: Icons.measurement,
      title: 'Create',
      value: 'create',
      subtitle: 'Define a new measurement.',
    },
    {
      icon: Icons.move,
      title: isReorderingMeasurements ? 'Save order' : 'Reorder',
      value: 'reorder',
      subtitle: isReorderingMeasurements ? 'Disable drag and drop mode.' : 'Enable drag and drop mode.',
      disabled: measurements.length <= 1,
    },
    {
      icon: Icons.expand,
      title: `Expand all`,
      subtitle: `Show all expanded content.`,
      value: 'expand',
      disabled: areAllMeasurementsExpanded,
    },
    {
      icon: Icons.collapse,
      title: `Collapse all`,
      subtitle: `Hide all expanded content.`,
      value: 'collapse',
      disabled: expandedMeasurements.size === 0,
    },
    {
      icon: showArchivedMeasurements ? Icons.hide : Icons.show,
      title: `${showArchivedMeasurements ? 'Hide' : 'Show'} archived`,
      subtitle: `Toggle the visibility of archived measurements.`,
      value: 'visibility',
    },
    {
      icon: Icons.delete,
      title: `Reset recordings`,
      subtitle: `Delete recorded values for the current day.`,
      value: 'reset',
    },
  ];

  const [isHabitMenuVisible, setIsHabitMenuVisible] = useState(false);
  const [showArchivedHabits, setShowArchivedHabits] = useState(false);
  const [isReorderingHabits, setIsReorderingHabits] = useState(false);
  const [habitPriorityOverrides, setHabitPriorityOverrides] = useState<string[] | null>(null);

  const orderedHabits = habitPriorityOverrides?.length
  ? habitPriorityOverrides
    .map((overrideId) => habits.find(({ id }) => id === overrideId))
    .filter((m) => !!m)
  : habits;
  const displayedHabits = orderedHabits
    .filter(h => !h.archived || showArchivedHabits);
  const [expandedHabits, setExpandedHabits] = useState(new Set());
  const displayedHabitIds = displayedHabits.map(({ id }) => id);
  const displayedExpandedHabits = intersection(expandedHabits, new Set(displayedHabitIds));
  const areAllHabitsExpanded = displayedExpandedHabits.size === displayedHabits.length;

  const submitHabitOrder = () => {
    if (!habitPriorityOverrides || !habitPriorityOverrides.length) return;

    const updatedHabits: ComputedHabit[] = [];
    habits.forEach((habit) => {
      const nextPriority = habitPriorityOverrides.findIndex((id) => id === habit.id);
      if (habit.priority === nextPriority) return;

      updatedHabits.push({ ...habit, priority: nextPriority });
    });

    if (!updatedHabits.length) return;
    dispatch(callUpdateHabits(updatedHabits));
  }

  const habitMenuItems: BottomDrawerItem<string>[] = [
    {
      icon: Icons.habit,
      title: 'Create',
      value: 'create',
      subtitle: 'Define a new habit.',
    },
    {
      icon: Icons.move,
      title: isReorderingHabits ? 'Save order' : 'Reorder',
      value: 'reorder',
      subtitle: isReorderingHabits ? 'Disable drag and drop mode.' : 'Enable drag and drop mode.',
      disabled: habits.length <= 1,
    },
    {
      icon: Icons.expand,
      title: `Expand all`,
      subtitle: `Show all expanded content.`,
      value: 'expand',
      disabled: areAllHabitsExpanded,
    },
    {
      icon: Icons.collapse,
      title: `Collapse all`,
      subtitle: `Hide all expanded content.`,
      value: 'collapse',
      disabled: expandedHabits.size === 0,
    },
    {
      icon: showArchivedHabits ? Icons.hide : Icons.show,
      title: `${showArchivedHabits ? 'Hide' : 'Show'} archived`,
      subtitle: `Toggle the visibility of archived habits.`,
      value: 'visibility',
    },
  ];
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
  const addMenuItems: BottomDrawerItem<string>[] = [
    {
      icon: Icons.measurement,
      title: 'Measurement',
      subtitle: 'Simple values to record and monitor over time.',
      value: 'measurement',
    },
    {
      icon: Icons.habit,
      title: 'Habit',
      value: 'habit',
      subtitle: 'Recurring targets to define goals and score progress.',
      disabled: measurements.length === 0,
    }
  ];

  const [tempRecordingsMap, setTempRecordingsMap] = useState<Map<string, Map<string, number | null>>>(new Map());
  const mergedRecordingsMap = new Map(measurements.map(({ id, recordings}) => [
    id,
    new Map<string, number | null>(recordings.map(({ date, value }) => [
      date,
      value,
    ])),
  ]));
  [...tempRecordingsMap.entries()].forEach(([id, recordingsMap]) => {
    const mergedRecordings = mergedRecordingsMap.get(id) || new Map<string, number | null>();
    [...recordingsMap.entries()].forEach(([date, value]) => {
      mergedRecordings.set(date, value);
    });
    mergedRecordingsMap.set(id, mergedRecordings);
  });

  const selectedWeekHabitCompletionMaps = [
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
  ];
  const selectedWeekDailyHabitPointTotals = selectedWeekDates.map((date, index) => {
    return date.after(today) ? 0 : dailyHabits.reduce((previous: number, habit: ComputedHabit) => {
      const [complete, _, __] = getHabitCompletion(habit, measurements, [date], mergedRecordingsMap);  
      selectedWeekHabitCompletionMaps[index].set(habit.id, complete);
      return previous + (complete ? habit.points : 0);
    }, 0);
  });
  
  const selectedWeekWeeklyHabitPointTotals = [0, 0, 0, 0, 0, 0, 0];
  weeklyHabits.forEach((habit) => {
    selectedWeekDates.filter((date) => !date.after(today)).find((_, index) => {
      const dates = selectedWeekDates.slice(0, index + 1);
      const [complete] = getHabitCompletion(habit, measurements, dates, mergedRecordingsMap);
      selectedWeekHabitCompletionMaps[index].set(habit.id, complete);

      if (complete) selectedWeekWeeklyHabitPointTotals[index] += habit.points;
      return complete;
    });
  });
  const selectedWeekHabitPointTotals = selectedWeekWeeklyHabitPointTotals.map((curr, index) => curr + (selectedWeekDailyHabitPointTotals[index] || 0));

  // const selectedDatePointTotal = (
  //   selectedWeekDailyHabitPointTotals[selectedDayOfWeek]
  //   + selectedWeekWeeklyHabitPointTotals[selectedDayOfWeek]
  // );

  // const selectedDateCumulativePointTotal = (
  //   selectedWeekDailyHabitPointTotals.slice(0, selectedDayOfWeek + 1).reduce((previous: number, current: number) => previous + current, 0)
  //   + selectedWeekWeeklyHabitPointTotals.slice(0, selectedDayOfWeek + 1).reduce((previous: number, current: number) => previous + current, 0)
  // );

  const selectedWeekPointTotal = selectedWeekHabitPointTotals.reduce((acc, curr) => acc + curr, 0);
  const perWeekPointTarget = activeHabits.reduce((previous: number, current: ComputedHabit) => {
    return previous + current.points * (current.isWeekly ? 1 : current.daysPerWeek);
  }, 0);

  // const weekProgressTarget = Math.max(selectedWeekPointTotal, perWeekPointTarget);
  const daysThisWeek = Math.min(SimpleDate.daysBetween(today, selectedWeekDates[0]) + 1, 7);

  const selectedWeekMeasurementValues = new Map<string, (number | null)[]>();
  measurements.forEach(({ id }) => {
    const values = selectedWeekDates.map((date) => {
      return getMeasurementRecordingValue(id, date, measurements, mergedRecordingsMap);
    });
    selectedWeekMeasurementValues.set(id, values);
  });

  const dispatch = useDispatch();
  const updateRecordings = useRef<null | NodeJS.Timeout>(null);
  const updateRecording = (value: number | null, measurementId: string, date: string) => {
    const nextTempRecordingsMap = new Map([...tempRecordingsMap.entries()].map(([ id, recordingsMap]) => [
      id,
      new Map([...recordingsMap.entries()]),
    ]));

    const recordingsMap = nextTempRecordingsMap.get(measurementId) || new Map<string, number | null>();
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
          updatedMeasurements.push({ ...measurement, recordings: nextRecordings.filter(({ value }) => value !== null) });
        }
      });
  
      if (updatedMeasurements.length) dispatch(callUpdateMeasurements(updatedMeasurements));
    }, 3000);
  }
  
  const clearRecordings = (date = selectedDate) => {
    const updatedMeasurements: Measurement[] = [];
    measurements.forEach((measurement) => {
      const nextRecordings = [...measurement.recordings].filter((recording) => recording.date !== date.toString());
      if (nextRecordings.length !== measurement.recordings.length) updatedMeasurements.push({ ...measurement, recordings: nextRecordings });
    });
    
    if (updatedMeasurements.length) dispatch(callUpdateMeasurements(updatedMeasurements));
  }
  
  const measurementStatus = useMeasurementStatus();
  const prevMeasurementUpdateStatus = useRef(measurementStatus.update);
  useEffect(() => {
    if (
      prevMeasurementUpdateStatus.current === Status.Measurement.Update.IN_PROGRESS
      && measurementStatus.update === Status.Measurement.Update.SUCCESS
    ) {
      const nextTempRecordingsMap = new Map();
      [...tempRecordingsMap.entries()].forEach(([ id, recordingsMap]) => {
        const measurement = measurements.find((m) => m.id === id);
        if (!measurement) return;

        const nextRecordings = new Map([...recordingsMap.entries()].filter(([date, value]) => {
          const recording = measurement.recordings.find((r) => r.date === date);
          return !recording || recording.value !== value;
        }));

        if (nextRecordings.size) nextTempRecordingsMap.set(id, nextRecordings);
      });

      setTempRecordingsMap(nextTempRecordingsMap);
      setMeasurementPriorityOverrides(null);
    }
    prevMeasurementUpdateStatus.current = measurementStatus.update
  }, [measurementStatus.update]);

  const habitStatus = useHabitStatus();
  const prevHabitUpdateStatus = useRef(habitStatus.update);
  useEffect(() => {
    if (
      prevHabitUpdateStatus.current === Status.Habit.Update.IN_PROGRESS
      && habitStatus.update === Status.Habit.Update.SUCCESS
    ) {
      setHabitPriorityOverrides(null);
    }
    prevHabitUpdateStatus.current = habitStatus.update
  }, [habitStatus.update]);

  const longPressPreviousTimeout = useRef<null | NodeJS.Timeout>(null);
  const longPressNextTimeout = useRef<null | NodeJS.Timeout>(null);
  const handleLongPressPrevious = (selectedDate: SimpleDate, delay: number = 250) => {
    triggerHaptic('impact', ImpactFeedbackStyle.Light);
    const nextSelectedDate = selectedDate.getDaysAgo(7);
    setSelectedDate(nextSelectedDate);
    
    const nextDelay = Math.max(delay - 25, 100);
    longPressPreviousTimeout.current = setTimeout(() => handleLongPressPrevious(nextSelectedDate, nextDelay), delay);
  }
  
  const handleLongPressNext = (selectedDate: SimpleDate, delay: number = 250) => {
    triggerHaptic('impact', ImpactFeedbackStyle.Light);
    const nextSelectedDate = selectedDate.getDaysAgo(-7);
    setSelectedDate(nextSelectedDate);
    
    const nextDelay = Math.max(delay - 25, 100);
    longPressNextTimeout.current = setTimeout(() => handleLongPressNext(nextSelectedDate, nextDelay), delay);
  }

  const measurementsWithStartDates = useMemo(() => {
    const result: [Measurement, SimpleDate][] = [];
    displayedMeasurements.map((measurement) => {
      const startDate = getMeasurementStartDate(measurement.id, measurements, mergedRecordingsMap);
      if (measurement.type !== 'combo' && startDate) result.push([measurement, SimpleDate.fromString(startDate)]);
    });
    return result;
  }, [displayedMeasurements, measurements, mergedRecordingsMap]);

  const measurementStatuses = (
    <View style={styles.measurementsStatusContainer}>
      {selectedWeekDates.map((date, index) => {
        const isSelected = index === selectedDayOfWeek;
        const isFuture = date.after(today);

        const isNullRecordings = measurementsWithStartDates.filter(([_, startDate]) => !startDate.after(date)).map(([measurement]) => {
          const recordings = selectedWeekMeasurementValues.get(measurement.id);
          return !recordings || !recordings.length || recordings[index] === null;
        });

        const nullRecordingCount = isNullRecordings.filter((value) => value).length;
        const nonNullRecordingCount = isNullRecordings.length - nullRecordingCount;
        const noMeasurements = isNullRecordings.length === 0;
        const measurementCompletion = noMeasurements || isFuture ? 0 : nonNullRecordingCount / isNullRecordings.length;

        const daily = selectedWeekDailyHabitPointTotals[index] || 0;
        const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
        const total = daily + weekly;
        
        const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
        return (
          <View
            key={date.toString()}
            style={[
              styles.measurementsStatus,
              isSelected ? styles.measurementsStatusSelected : {},
            ]}
          >
            {/* <View style={{ flexShrink: 1, width: '100%', alignItems: 'flex-end' }}> */}
            {/* <View style)={{ width: 1, borderRadius: 100, backgroundColor: color, alignSelf: 'stretch' }} /> */}
            {/* <View style={{ flexShrink: 1, width: '100%', alignItems: 'flex-start' }}> */}
            <View>
              <Icon
                source={(isFuture || isNullRecordings.length === 0) ? Icons.indeterminate : measurementCompletion === 0 ? Icons.progressNone : Icons.progressPartial(measurementCompletion)}
                size={14}
                color={color}
              />
            </View>
            {/* <View
              style={[styles.measurementsProgressBar, isSelected && styles.measurementsProgressBarSelected ]}
            > */}
              {/* {isSelected
                ? <>
                  {filteredMeasurements.map((measurement, index) => {
                    const palette = getCombinedPalette(measurement.baseColor);
                    const isNull = isNullRecordings[index];
                    return !isNull && <View
                      style={[styles.measurementsProgressPiece, {
                        backgroundColor: isNull ? theme.colors.surfaceDisabled : globalPalette.primary,
                      }]}
                    />
                  })}
                  {filteredMeasurements.map((measurement, index) => {
                    const isNull = isNullRecordings[index];
                    return isNull && <View
                      style={[styles.measurementsProgressPiece, {
                        // backgroundColor: theme.colors.surfaceDisabled,
                      }]}
                    />
                  })}
                </>
                : <View
                style={[styles.measurementsProgressBar, {
                  width: `${100 * (noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length)}%`,
                  backgroundColor: isSelected ? globalPalette.primary : globalPalette.alt,
                }]}
              />
              } */}
              {/* <View
                  style={[styles.measurementsProgressBar, {
                    width: `${100 * (noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length)}%`,
                    backgroundColor: isSelected ? globalPalette.primary : nullRecordingCount ? theme.colors.surfaceDisabled : globalPalette.alt,
                  }]}
                />
            </View> */}
            {/* <ProgressBar
              style={styles.measurementsProgressBar}
              color={isSelected ? globalPalette.primary : globalPalette.alt}
              progress={noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length}
            /> */}
          </View>
        )
      })}
    </View>
  );

  // const weeklyPoints = (
  //   <>
  //     {selectedWeekDates.map((date) => {
        

  //       return (
  //         <>
  //           {isFuture ? (
  //             <View style={{ padding: 4 }}>
  //               <Icon source={Icons.indeterminate} size={16} color={color} />
  //             </View>
  //           ) : (
  //             <Points
  //               style={styles.dailyPointTotal}
  //               points={total}
  //               size='medium'
  //               disabled={!isSelected}
  //               color={color}
  //             />
  //           )}
  //         </>
  //       )
  //     })}
  //   </>
  // )

  const measurementDailyProgressSection = (() => {
    const filteredMeasurements = displayedMeasurements.filter((measurement) => {
      const startDate = getMeasurementStartDate(measurement.id, measurements, mergedRecordingsMap);
      return startDate && selectedDate.toString() >= startDate;
    });

    const isNullRecordings = filteredMeasurements.map((measurement) => {
      const recordings = selectedWeekMeasurementValues.get(measurement.id);
      return !recordings || !recordings.length || recordings[selectedDayOfWeek] === null;
    });
    
    const nullRecordingCount = isNullRecordings.filter((value) => value).length;
    const nonNullRecordingCount = filteredMeasurements.length - nullRecordingCount;

    return (
      <View>
        <View style={styles.measurementDailyProgress}>
          {filteredMeasurements.map((measurement, index) => {
            
            const isNull = isNullRecordings[index];
            const palette = getCombinedPalette(measurement.baseColor);
  
            const color = palette.primary;
            return (
              <View
                key={measurement.id.toString()}
                style={[
                  styles.measurementDailyProgressIcon,
                ]}
              >
                <View>
                  <Icon
                    source={isNull ? Icons.progressNone : Icons.progressComplete}
                    size={8}
                    color={color}
                  />
                </View>
              </View>
            )
          })}
        </View>
        <View style={styles.weekPointsContainer}>
          <Text variant='bodySmall' style={[styles.weekPointsLabel]}>Day</Text>
          <View style={{ flexGrow: 1 }} />
          <Text variant='titleSmall'>{formatNumber(nonNullRecordingCount, 0)}</Text>
          <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
          <Text variant='titleSmall'>{formatNumber(filteredMeasurements.length, 0)}</Text>
        </View>
      </View>
    );
  })();

  const measurementWeeklyProgressSection = (() => {
    const measurementCounts: number[] = [];
    const measurementCompletions: number[] = [];
    selectedWeekDates.forEach((date, index) => {
      const isFuture = date.after(today);
      const filteredMeasurements = displayedMeasurements.filter((measurement) => {
        const startDate = getMeasurementStartDate(measurement.id, measurements, mergedRecordingsMap);
        return startDate && date.toString() >= startDate;
      });
      
      const isNullRecordings = filteredMeasurements.map((measurement) => {
        const recordings = selectedWeekMeasurementValues.get(measurement.id);
        return !recordings || !recordings.length || recordings[index] === null;
      });
      const nullRecordingCount = isNullRecordings.filter((value) => value).length;
      const nonNullRecordingCount = filteredMeasurements.length - nullRecordingCount;
      const noMeasurements = filteredMeasurements.length === 0;
      
      
      measurementCompletions[index] = noMeasurements || isFuture ? 0 : nonNullRecordingCount;
      measurementCounts[index] = filteredMeasurements.length;
    });

    const weekMeasurementCount = measurementCounts.reduce((acc, curr) => acc + curr, 0);
    const weekMeasurementCompletions = measurementCompletions.reduce((acc, curr) => acc + curr, 0);

    return (
      <View>
        <View style={styles.measurementsStatusContainer}>
          {selectedWeekDates.map((date, index) => {
            const isSelected = index === selectedDayOfWeek;
            
            const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
            return (
              <View
                key={date.toString()}
                style={[
                  styles.measurementsStatus,
                  isSelected ? styles.measurementsStatusSelected : {},
                ]}
              >
                <View>
                  <Icon
                    source={measurementCompletions[index] === 0 ? Icons.progressNone : Icons.progressPartial(measurementCompletions[index] / measurementCounts[index])}
                    size={12}
                    color={color}
                  />
                </View>
              </View>
            )
          })}
        </View>
        <View style={styles.weekPointsContainer}>
          <Text variant='bodySmall' style={[styles.weekPointsLabel]}>Week</Text>
          <View style={{ flexGrow: 1 }} />
          <Text variant='titleSmall'>{formatNumber(weekMeasurementCompletions, 0)}</Text>
          <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
          <Text variant='titleSmall'>{formatNumber(weekMeasurementCount, 0)}</Text>
        </View>
      </View>
    );
  })();

  const habitStatuses = (
    <View style={styles.measurementsStatusContainer}>
      {selectedWeekDates.map((date, index) => {
        const isSelected = index === selectedDayOfWeek;
        const isFuture = date.after(today);
        const filteredMeasurements = displayedMeasurements.filter((measurement) => {
          const startDate = getMeasurementStartDate(measurement.id, measurements, mergedRecordingsMap);
          return measurement.type !== 'combo' && startDate && date.toString() >= startDate;
        });

        const isNullRecordings = filteredMeasurements.map((measurement) => {
          const recordings = selectedWeekMeasurementValues.get(measurement.id);
          return !recordings || !recordings.length || recordings[index] === null;
        });

        const nullRecordingCount = isNullRecordings.filter((value) => value).length;
        const nonNullRecordingCount = filteredMeasurements.length - nullRecordingCount;
        const noMeasurements = filteredMeasurements.length === 0;
        const measurementCompletion = noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length;

        const daily = selectedWeekDailyHabitPointTotals[index] || 0;
        const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
        const total = daily + weekly;
        
        const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
        return (
          <View
            key={date.toString()}
            style={[
              styles.measurementsStatus,
              isSelected ? styles.measurementsStatusSelected : {},
            ]}
          >
            {/* <View style={{ flexShrink: 1, width: '100%', alignItems: 'flex-end' }}> */}
            {/* <View style)={{ width: 1, borderRadius: 100, backgroundColor: color, alignSelf: 'stretch' }} /> */}
            {/* <View style={{ flexShrink: 1, width: '100%', alignItems: 'flex-start' }}> */}
            <View>
              {isFuture || noMeasurements ? (
                <View style={{ padding: 5 }}>
                  <Icon source={Icons.indeterminate} size={14} color={color} />
                </View>
              ) : (
                <Points
                  style={styles.dailyPointTotal}
                  points={total}
                  size='medium'
                  disabled={!isSelected}
                  color={color}
                  inline
                />
              )}
            </View>
            {/* <View
              style={[styles.measurementsProgressBar, isSelected && styles.measurementsProgressBarSelected ]}
            > */}
              {/* {isSelected
                ? <>
                  {filteredMeasurements.map((measurement, index) => {
                    const palette = getCombinedPalette(measurement.baseColor);
                    const isNull = isNullRecordings[index];
                    return !isNull && <View
                      style={[styles.measurementsProgressPiece, {
                        backgroundColor: isNull ? theme.colors.surfaceDisabled : globalPalette.primary,
                      }]}
                    />
                  })}
                  {filteredMeasurements.map((measurement, index) => {
                    const isNull = isNullRecordings[index];
                    return isNull && <View
                      style={[styles.measurementsProgressPiece, {
                        // backgroundColor: theme.colors.surfaceDisabled,
                      }]}
                    />
                  })}
                </>
                : <View
                style={[styles.measurementsProgressBar, {
                  width: `${100 * (noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length)}%`,
                  backgroundColor: isSelected ? globalPalette.primary : globalPalette.alt,
                }]}
              />
              } */}
              {/* <View
                  style={[styles.measurementsProgressBar, {
                    width: `${100 * (noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length)}%`,
                    backgroundColor: isSelected ? globalPalette.primary : nullRecordingCount ? theme.colors.surfaceDisabled : globalPalette.alt,
                  }]}
                />
            </View> */}
            {/* <ProgressBar
              style={styles.measurementsProgressBar}
              color={isSelected ? globalPalette.primary : globalPalette.alt}
              progress={noMeasurements || isFuture ? 0 : nonNullRecordingCount / filteredMeasurements.length}
            /> */}
          </View>
        )
      })}
    </View>
  );
  
  const habitProgressSection = displayedHabits.length ? !!perWeekPointTarget &&
    <>
      <View style={styles.pointsProgressContainer}>
        {!today.after(selectedWeekDates[5]) && !today.before(selectedWeekDates[0]) && (
          <View style={styles.pointsProgressTargetOuter}>
            <View style={{ flexGrow: daysThisWeek }} />
            <View style={styles.pointsProgressTarget}>
              <View style={styles.pointsProgressTargetInner} />
            </View>
            <View style={{ flexGrow: 7 - daysThisWeek }} />
          </View>
        )}
        {selectedWeekDates.map((date, index) => {
          const dailyPoints = selectedWeekDailyHabitPointTotals[index];
          const weeklyPoints = selectedWeekWeeklyHabitPointTotals[index];
          
          const isFuture = date.after(today);
          const isSelected = date.equals(selectedDate);
          const backgroundColor = globalPalette.primary;
          return isFuture ? null : (
            <View key={date.toString()} style={[styles.pointsProgressBar, { flexGrow: dailyPoints + weeklyPoints }]}>
              {/* <View style={[styles.pointsProgressBarEnd, { left: -2, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]} /> */}
              {/* <View style={[styles.pointsProgressBarEnd, { right: -2 }]} /> */}
              {/* <View style={[styles.pointsProgressBarBackdrop]} /> */}
              <View style={[styles.pointsProgressBarInner, { backgroundColor }]} />
            </View>
          );
        })}
        <View style={{
          flexDirection: 'row',
          flexBasis: 8,
          flexGrow: Math.max(0, perWeekPointTarget - selectedWeekPointTotal),
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
        </View>
      </View>
      <View style={styles.weekPointsContainer}>
        <View style={{ flexGrow: 1 }} />
        {/* <Text variant='bodySmall' style={styles.weekPointsLabel}>Day</Text>
        <Points size={'small'} points={selectedWeekHabitPointTotals[selectedDayOfWeek]} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
        <View style={{ flexGrow: 0, width: 12 }} /> */}
        <Text variant='bodySmall' style={styles.weekPointsLabel}>Week</Text>
        <Text variant='titleSmall'>{selectedWeekPointTotal}</Text>
        <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
        <Points size={'small'} points={perWeekPointTarget} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
        {/* <Text variant='bodySmall' style={[styles.weekPointsLabel, { marginLeft: 16 }]}>Average</Text>
        <Text variant='titleSmall'>{formatNumber(selectedWeekPointTotal / daysThisWeek, 1)}</Text>
        <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
        <Points size={'small'} points={perWeekPointTarget / 7} decimals={1} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} /> */}
      </View>
    </> : null;


  const habitDailyProgressSection = (
      <View style={{ paddingHorizontal: 0 }}>
        <View style={styles.pointsProgressContainer}>
          {!today.after(selectedWeekDates[6]) && !today.before(selectedWeekDates[0]) && (
            <View style={styles.pointsProgressTargetOuter}>
              <View style={{ flexGrow: daysThisWeek }} />
              <View style={styles.pointsProgressTarget}>
                <View style={styles.pointsProgressTargetInner} />
              </View>
              <View style={{ flexGrow: 7 - daysThisWeek }} />
            </View>
          )}
          {(() => {
            
            const isFuture = selectedDate.after(today);
            const isSelected = selectedDate.equals(selectedDate);

            return displayedHabits.map((habit, index) => {
              const palette = getCombinedPalette(habit.baseColor);
              const backgroundColor = isSelected ? palette.primary : palette.alt;
              const isComplete = selectedWeekHabitCompletionMaps[selectedDayOfWeek].get(habit.id);
              return isComplete ? (
                <View key={habit.id} style={[styles.pointsProgressBar, { flexGrow: habit.points }]}>
                  <View style={[styles.pointsProgressBarEnd, { left: -2, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]} />
                  <View style={[styles.pointsProgressBarEnd, { right: -2 }]} />
                  <View style={[styles.pointsProgressBarInner, { backgroundColor }]} />
                </View>
              ) : null;
            });
          })()}
          <View style={{
            flexDirection: 'row',
            flexBasis: 0,
            flexGrow: Math.max(0, (perWeekPointTarget / 7) - selectedWeekHabitPointTotals[selectedDayOfWeek]),
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}>
            {/* <View style={{
              flexGrow: 1,
              height: 8,
              borderRadius: 8,
              backgroundColor: theme.colors.surfaceDisabled,
            }} /> */}
          </View>
        </View>
        <View style={styles.weekPointsContainer}>
          <Text variant='bodySmall' style={[styles.weekPointsLabel]}>Day</Text>
          <View style={{ flexGrow: 1 }} />
          <Text variant='titleSmall'>{formatNumber(selectedWeekHabitPointTotals[selectedDayOfWeek], 1)}</Text>
          <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
          <Points size={'small'} points={perWeekPointTarget / 7} decimals={1} inline textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
        </View>
      </View>
  );
  
  const habitWeeklyProgressSection = (
    displayedHabits.length ? (
      <View style={{ paddingHorizontal: 0 }}>
        {!!perWeekPointTarget &&
          <View style={styles.pointsProgressContainer}>
            {!today.after(selectedWeekDates[6]) && !today.before(selectedWeekDates[0]) && (
              <View style={styles.pointsProgressTargetOuter}>
                <View style={{ flexGrow: daysThisWeek }} />
                <View style={styles.pointsProgressTarget}>
                  <View style={styles.pointsProgressTargetInner} />
                </View>
                <View style={{ flexGrow: 7 - daysThisWeek }} />
              </View>
            )}
            {selectedWeekDates.map((date, index) => {
              const dailyPoints = selectedWeekDailyHabitPointTotals[index];
              const weeklyPoints = selectedWeekWeeklyHabitPointTotals[index];
              
              const isFuture = date.after(today);
              const isSelected = date.equals(selectedDate);
              const backgroundColor = isSelected ? globalPalette.primary : globalPalette.alt;
              return isFuture ? null : (
                <View key={date.toString()} style={[styles.pointsProgressBar, { flexGrow: dailyPoints + weeklyPoints }]}>
                  <View style={[styles.pointsProgressBarEnd, { left: -2, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]} />
                  <View style={[styles.pointsProgressBarEnd, { right: -2 }]} />
                  <View style={[styles.pointsProgressBarInner, { backgroundColor }]} />
                </View>
              );
            })}
            <View style={{
              flexDirection: 'row',
              flexBasis: 0,
              flexGrow: Math.max(0, perWeekPointTarget - selectedWeekPointTotal),
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
              {/* <View style={{
                flexGrow: 1,
                height: 8,
                borderRadius: 8,
                backgroundColor: theme.colors.surfaceDisabled,
              }} /> */}
            </View>
          </View>
        }
        <View style={styles.weekPointsContainer}>
          <Text variant='bodySmall' style={styles.weekPointsLabel}>Week</Text>
          <View style={{ flexGrow: 1 }} />
          <Text variant='titleSmall'>{selectedWeekPointTotal}</Text>
          <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
          <Points size={'small'} points={perWeekPointTarget} inline textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
        </View>
      </View>
    ) : null
  );

  return (
    <>
      <Header
        // color={theme.colors.elevation.level3}
        color={theme.dark ? globalPalette.backdrop : theme.colors.elevation.level5}
        showMenuButton
        // bordered
        // title={'Measure'}
        title={
          isToday ? 'Today' :
          `${selectedDate.toFormattedString(true, false, true)}`
        }
        // subtitle={
        //   isReorderingMeasurements ? ' : Measurements' :
        //   isReorderingHabits ? ' : Habits' : 
        //   ''
        // }
        actionContent={
          <>
            {/* {
              !isToday ? (
                <Button
                  mode='text'
                  style={{ borderRadius: 12, marginRight: 4 }}
                  textColor={theme.colors.onSurface}
                  onPress={() => {
                    setSelectedDate(today);

                    if (!flatListRef.current) return;
                    flatListRef.current.scrollToIndex({ index: 52, animated: false});
                  }}
                >
                  TODAY
                </Button>
              ) : null
            } */}
            {/* <BottomDrawer
              title='Create'
              visible={isAddMenuVisible}
              onDismiss={() => setIsAddMenuVisible(false)}
              anchor={
                <IconButton
                  style={styles.headerCreateButton}
                  containerColor={globalPalette.backdrop}
                  iconColor={theme.colors.onSurface}
                  icon={Icons.add}
                  size={18}
                  onPress={() => setIsAddMenuVisible(true)}
                />
              }
              items={addMenuItems}
              onSelect={(item) => {
                setIsAddMenuVisible(false);
                setTimeout(() => {
                  router.push(item.value === 'measurement' ? '/measurement/create' : '/habit/create');
                }, 0);
              }}
            /> */}
          </>
        }
      />
      <View
        // onLayout={onLayout}
        style={styles.container}
      >
        <View style={[styles.timelineContainer]}>
          {/* <Text variant='bodyMedium' style={styles.timeHeaderText}>
            {selectedWeekDates[0].toFormattedString()} - {selectedWeekDates[6].toFormattedString()}
          </Text> */}
          {timelineFlatList}
          {/* {measurementStatuses} */}
          {/* {habitStatuses} */}
          {habitProgressSection}
        </View>
        {/* <View style={{ flexDirection: 'row', paddingHorizontal: 8, gap: 12, marginBottom: 8 }}>
          <View style={{ width: '100%', flexGrow: 1, flexShrink: 1, }}>
            <View style={[{ borderRadius: 20, width: '100%', gap: 8, flexGrow: 1, flexShrink: 1, padding: 16 }, globalStyles.elevation1]}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 0, gap: 8 }}>
              <Text variant='bodyLarge' style={{ flexShrink: 0, textAlign: 'left', marginTop: 4, marginBottom: 2 }}>
                Measurements
              </Text>

              <Text variant='titleMedium' style={{ flexGrow: 0, textAlign: 'center', marginTop: 4, marginBottom: 2 }}>
                {selectedDate.toFormattedString()}
              </Text>
            </View>
              {measurementDailyProgressSection}
              {measurementWeeklyProgressSection}
            </View>
          </View>
          <View style={{ width: '100%', flexGrow: 1, flexShrink: 1, }}>
            <View style={[{ borderRadius: 20, width: '100%', gap: 8, flexGrow: 1, flexShrink: 1, padding: 16 }, globalStyles.elevation1]}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 0, gap: 8 }}>
                <Text variant='bodyLarge' style={{ flexShrink: 0, textAlign: 'left', marginTop: 4, marginBottom: 2 }}>
                  Habits
                </Text>

                <Text variant='titleMedium' style={{ flexGrow: 0, textAlign: 'center', marginTop: 4, marginBottom: 2 }}>
                  {selectedWeekDates[0].toFormattedString(false, false, false, true)} - {selectedWeekDates[6].toFormattedString(false, false, false, true)}
                </Text>
              </View>
              {habitDailyProgressSection}
              {habitWeeklyProgressSection}
            </View>
          </View>

        </View> */}
        {/* <GestureDetector gesture={panGesture}> */}
          {/* <Animated.View style={[
            styles.timelineContainer,
            {left: -containerWidth.value},
            timelineContainerAnimated,
            // animatedSelectedDate.value === selectedDate.toString() && { transform: [{ translateX: 0}]}
          ]}> */}
            {/* <View style={styles.timelineHeader}>
              <IconButton
                style={styles.timelineHeaderButton}
                icon={Icons.left}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedDate(selectedDate.getDaysAgo(7));
                }}
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
                icon={Icons.right}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedDate(selectedDate.getDaysAgo(-7));
                }}
                onLongPress={() => handleLongPressNext(selectedDate)}
                onPressOut={() => {
                  if (longPressNextTimeout.current === null) return;
                  clearTimeout(longPressNextTimeout.current);
                  longPressNextTimeout.current = null;
                }}
                delayLongPress={600}
              />
            </View> */}
            {/* <View style={[styles.timelineContent]}>
              {previousWeekDates.map((date) => {
                const dayOfWeek = date.getDayOfWeekLabel();
                const isSelected = date.equals(selectedDate);
                const isToday = date.equals(today);

                return (
                  <View
                    key={date.toString()}
                    style={[
                      styles.timelineDate,
                      isToday && styles.timelineDateToday,
                      isSelected && styles.timelineDateSelected,
                    ]}
                  >
                    <Pressable
                      onPress={() => sharedSelectedDate.value === animatedSelectedDate.value && handleSelectedDateChange(date)}
                      style={[
                        styles.timelineDateContainer,
                        isToday && styles.timelineDateContainerToday,
                        isSelected && styles.timelineDateContainerSelected,
                      ]}
                    >
                      <>
                        <View
                          style={[
                            styles.timelineDateContent,
                            isToday && styles.timelineDateContentToday,
                            isSelected && styles.timelineDateContentSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timelineDateDayOfWeek,
                              isToday && styles.timelineDateDayOfWeekToday,
                              isSelected && styles.timelineDateDayOfWeekSelected,
                            ]}
                            >
                            {dayOfWeek.toUpperCase()}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', 'justifyContent': 'center'}}>
                            {isToday && <View
                              style={[
                                styles.todayIndicator,
                                isSelected && styles.todayIndicatorToday,
                              ]}
                            />}
                            <Text variant='titleMedium'
                              style={[
                                styles.timelineDateDay,
                                isToday && styles.timelineDateDayToday,
                                isSelected && styles.timelineDateDaySelected,
                              ]}
                            >
                              {date.day}
                            </Text>
                          </View>
                        </View>
                      </>
                    </Pressable>
                  </View>
                )
              })}
            </View>
            <View style={styles.timelineContent}>
              {selectedWeekDates.map((date) => {
                const dayOfWeek = date.getDayOfWeekLabel();
                const isSelected = date.equals(selectedDate);
                const isToday = date.equals(today);

                return (
                  <View
                    key={date.toString()}
                    style={[
                      styles.timelineDate,
                      isToday && styles.timelineDateToday,
                      isSelected && styles.timelineDateSelected,
                    ]}
                  >
                    <Pressable
                      onPress={() => sharedSelectedDate.value === animatedSelectedDate.value && handleSelectedDateChange(date)}
                      style={[
                        styles.timelineDateContainer,
                        isToday && styles.timelineDateContainerToday,
                        isSelected && styles.timelineDateContainerSelected,
                      ]}
                    >
                      <>
                        <View
                          style={[
                            styles.timelineDateContent,
                            isToday && styles.timelineDateContentToday,
                            isSelected && styles.timelineDateContentSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timelineDateDayOfWeek,
                              isToday && styles.timelineDateDayOfWeekToday,
                              isSelected && styles.timelineDateDayOfWeekSelected,
                            ]}
                            >
                            {dayOfWeek.toUpperCase()}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', 'justifyContent': 'center'}}>
                            {isToday && <View
                              style={[
                                styles.todayIndicator,
                                isSelected && styles.todayIndicatorToday,
                              ]}
                            />}
                            <Text variant='titleMedium'
                              style={[
                                styles.timelineDateDay,
                                isToday && styles.timelineDateDayToday,
                                isSelected && styles.timelineDateDaySelected,
                              ]}
                            >
                              {date.day}
                            </Text>
                          </View>
                        </View>
                      </>
                    </Pressable>
                  </View>
                )
              })}
            </View>
            <View style={styles.timelineContent}>
              {nextWeekDates.map((date) => {
                const dayOfWeek = date.getDayOfWeekLabel();
                const isSelected = date.equals(selectedDate);
                const isToday = date.equals(today);

                return (
                  <View
                    key={date.toString()}
                    style={[
                      styles.timelineDate,
                      isToday && styles.timelineDateToday,
                      isSelected && styles.timelineDateSelected,
                    ]}
                  >
                    <Pressable
                      onPress={() => sharedSelectedDate.value === animatedSelectedDate.value && handleSelectedDateChange(date)}
                      style={[
                        styles.timelineDateContainer,
                        isToday && styles.timelineDateContainerToday,
                        isSelected && styles.timelineDateContainerSelected,
                      ]}
                    >
                      <>
                        <View
                          style={[
                            styles.timelineDateContent,
                            isToday && styles.timelineDateContentToday,
                            isSelected && styles.timelineDateContentSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timelineDateDayOfWeek,
                              isToday && styles.timelineDateDayOfWeekToday,
                              isSelected && styles.timelineDateDayOfWeekSelected,
                            ]}
                            >
                            {dayOfWeek.toUpperCase()}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', 'justifyContent': 'center'}}>
                            {isToday && <View
                              style={[
                                styles.todayIndicator,
                                isSelected && styles.todayIndicatorToday,
                              ]}
                            />}
                            <Text variant='titleMedium'
                              style={[
                                styles.timelineDateDay,
                                isToday && styles.timelineDateDayToday,
                                isSelected && styles.timelineDateDaySelected,
                              ]}
                            >
                              {date.day}
                            </Text>
                          </View>
                        </View>
                      </>
                    </Pressable>
                  </View>
                )
              })}
            </View> */}
          {/* </Animated.View> */}
        {/* </GestureDetector> */}
        {/* <View style={[styles.sectionHeader, { borderBottomWidth: 1 }]}>

        </View> */}
        <NestableScrollContainer style={styles.content}>
          <View style={[globalStyles.elevation1, styles.section]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Icon source={Icons.measurement} size={14} />
              </View>
              <Text style={styles.sectionHeaderTitle} variant='labelLarge'>MEASUREMENTS</Text>
              {!!measurements.length && isReorderingMeasurements && <IconButton
                style={styles.sectionHeaderButton}
                icon={Icons.move}
                size={16}
                onPress={() => {
                  submitMeasurementOrder();
                  setIsReorderingMeasurements(false);
                }}
                disabled={!measurements.length}
                containerColor={globalPalette.backdrop}
              />}
              {!!measurements.length && showArchivedMeasurements && <IconButton
                style={styles.sectionHeaderButton}
                icon={Icons.show}
                size={16}
                onPress={() => {
                  setShowArchivedMeasurements(false)
                }}
                disabled={!measurements.length}
                containerColor={globalPalette.backdrop}
              />}
              {<BottomDrawer
                  title='Measurements'
                  visible={isMeasurementMenuVisible}
                  onDismiss={() => setIsMeasurementMenuVisible(false)}
                  anchor={
                    <IconButton
                      style={styles.sectionHeaderButton}
                      icon={Icons.settings}
                      size={16}
                      onPress={() => {
                        setIsMeasurementMenuVisible(true);
                      }}
                    />
                  }
                  items={measurementMenuItems}
                  onSelect={({ value }) => {
                    switch (value) {
                      case 'create':
                        router.push('/measurement/create');
                        break;
                      case 'reorder':
                        if (isReorderingMeasurements) submitMeasurementOrder()
                        else setMeasurementPriorityOverrides(orderedMeasurements.map(({ id }) => id));
                        setIsReorderingMeasurements(!isReorderingMeasurements);
                        break;
                      case 'expand':
                        setExpandedMeasurements(new Set(displayedMeasurementIds));
                        break;
                      case 'collapse':
                        setExpandedMeasurements(new Set());
                        break;
                      case 'visibility':
                        setShowArchivedMeasurements(!showArchivedMeasurements);
                        break;
                      case 'reset':
                        setTempRecordingsMap(new Map());
                        clearRecordings();
                        break;
                      default:
                        break;
                    }
                    setIsMeasurementMenuVisible(false);
                  }}
                />
              }
            <View style={styles.dailyPointTotalContainer}>
              {selectedWeekDates.map((date, index) => {
                const isToday = date.toString() === today.toString();
                const daily = selectedWeekDailyHabitPointTotals[index] || 0;
                const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
                const total = daily + weekly;
                const isSelected = index === selectedDayOfWeek;
                const isFuture = date.after(today);

                const isNullRecordings = measurementsWithStartDates.filter(([_, startDate]) => !startDate.after(date)).map(([measurement]) => {
                  const recordings = selectedWeekMeasurementValues.get(measurement.id);
                  return !recordings || !recordings.length || recordings[index] === null;
                });

                const nullRecordingCount = isNullRecordings.filter((value) => value).length;
                const nonNullRecordingCount = isNullRecordings.length - nullRecordingCount;
                const noMeasurements = isNullRecordings.length === 0;
                const measurementCompletion = noMeasurements || isFuture ? 0 : nonNullRecordingCount / isNullRecordings.length;
                                  
                const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
                return (
                  <TouchableRipple
                    key={date.toString()}
                    style={[
                      styles.dailyPoints,
                      // isSelected ? styles.dailyPointsSelected : {},
                      isToday ? styles.dailyPointsToday : {},
                    ]}
                    onPress={() => handleSelectedDateChange(date)}
                  >
                    <>
                      <View style={[styles.dailyPointsContainer, isToday ? styles.dailyPointsContainerToday : {}, isSelected ? styles.dailyPointsContainerSelected : {}]}>
                        <View style={{ alignItems: 'center', gap: 4 }}>
                          <Text variant='bodySmall' style={{ ...styles.dailyPointDayOfWeek, color }}>{date.getDayOfWeekLabel().toUpperCase()}</Text>
                          <Icon
                            source={(isFuture || isNullRecordings.length === 0) ? Icons.indeterminate : measurementCompletion === 0 ? Icons.progressNone : Icons.progressPartial(measurementCompletion)}
                            size={12}
                            color={color}
                          />
                        </View>
                      </View>
                    </>
                  </TouchableRipple>
                )
              })}
            </View>
            </View>
            <View style={styles.sectionContent}>
            <View style={styles.recordingView}>
              {displayedMeasurements.length ? (
                <>
                  {isReorderingMeasurements ? (
                    <NestableDraggableFlatList
                      data={measurementPriorityOverrides || []}
                      onDragEnd={({ data }) => {
                        setMeasurementPriorityOverrides(data);
                      }}
                      keyExtractor={(id) => id}
                      activationDistance={forWeb(1, 20)}
                      renderItem={({ item: measurementId, getIndex, drag, isActive }) => {
                        const measurement = measurements.find(({ id }) => id === measurementId);
                        if (!measurement) return;
  
                        return (
                          <ScaleDecorator activeScale={1.05}>
                            <RecordingMeasurementItem
                              index={getIndex() || 0}
                              measurement={measurement}
                              currentDate={selectedDate}
                              weekMeasurementValues={selectedWeekMeasurementValues.get(measurement.id) || []}
                              onLongPress={forWeb(null, () => {
                                if (isReorderingMeasurements) {
                                  drag();
                                  triggerHaptic('selection');
                                }
                              })}
                              onPressIn={forWeb(() => isReorderingMeasurements && drag(), null)}
                              disabled={isActive}
                              reordering
                            />
                          </ScaleDecorator>
                        );
                      }}
                    />
                  ) : (
                    <>
                      {displayedMeasurements.map((measurement, index) => {
                        const { id } = measurement;
                        return (
                          <RecordingMeasurementItem
                            key={id}
                            index={index}
                            measurement={measurement}
                            currentDate={selectedDate}
                            weekMeasurementValues={selectedWeekMeasurementValues.get(measurement.id) || []}
                            mergedRecordingValues={mergedRecordingsMap}
                            expanded={displayedExpandedMeasurements.has(id)}
                            onValueChange={(nextValue: number | null) => {
                              triggerHaptic('impact', ImpactFeedbackStyle.Light);
                              updateRecording(nextValue, id, selectedDate.toString());
                            }}
                            onPress={() => {
                              const nextExpandedMeasurements = new Set([...expandedMeasurements]);
                              nextExpandedMeasurements.has(id) ? nextExpandedMeasurements.delete(id) : nextExpandedMeasurements.add(id);
                              setExpandedMeasurements(nextExpandedMeasurements);
                            }}
                            onLongPress={(id) => {
                              triggerHaptic('selection');
                              router.push(`/measurement/${id}`);
                            }}
                          />
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.noData}>
                    <View style={styles.noDataIcon}>
                      <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={styles.noDataText} variant='bodyLarge'>No active measurements</Text>
                  </View>
                  {!measurements.length && (
                    <Button
                      style={styles.noDataButton}
                      mode='contained'
                      onPress={() => { router.push('/measurement/create'); }}
                    >
                      <Text variant='labelLarge' style={styles.noDataButtonText}>
                        Create your first measurement
                      </Text>
                    </Button>
                  )}
                </>
              )}
            </View>
            </View>
          </View>
            <View style={[globalStyles.elevation1, styles.section]}>
            {!!measurements.length && (  
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderIcon}>
                  <Icon source={Icons.habit} size={14} />
                </View>
                <Text style={styles.sectionHeaderTitle} variant='labelLarge'>HABITS</Text>
                {!!habits.length && isReorderingHabits && <IconButton
                  style={styles.sectionHeaderButton}
                  icon={Icons.move}
                  size={16}
                  onPress={() => {
                    submitHabitOrder();
                    setIsReorderingHabits(false);
                  }}
                  disabled={!habits.length}
                  containerColor={globalPalette.backdrop}
                />}
                {!!habits.length && showArchivedHabits && <IconButton
                  style={styles.sectionHeaderButton}
                  icon={Icons.show}
                  size={16}
                  onPress={() => {
                    setShowArchivedHabits(false)
                  }}
                  disabled={!habits.length}
                  containerColor={globalPalette.backdrop}
                />}
                <BottomDrawer
                  title='Habits'
                  visible={isHabitMenuVisible}
                  onDismiss={() => setIsHabitMenuVisible(false)}
                  anchor={
                    <IconButton
                      style={styles.sectionHeaderButton}
                      icon={Icons.settings}
                      size={16}
                      onPress={() => {
                        setIsHabitMenuVisible(true);
                      }}
                    />
                  }
                  items={habitMenuItems}
                  onSelect={({ value }) => {
                    setTimeout(() => {
                      switch (value) {
                        case 'create':
                          router.push('/habit/create');
                          break;
                        case 'reorder':
                          if (isReorderingHabits) submitHabitOrder();
                          else setHabitPriorityOverrides(orderedHabits.map(({ id }) => id));
                          setIsReorderingHabits(!isReorderingHabits);
                          break;
                        case 'expand':
                          setExpandedHabits(new Set(displayedHabitIds));
                          break;
                        case 'collapse':
                          setExpandedHabits(new Set());
                          break;
                        case 'visibility':
                          setShowArchivedHabits(!showArchivedHabits);
                          break;
                        default:
                          break;
                      }
                    }, 150);
                    setIsHabitMenuVisible(false);
                  }}
                />
                {/* {displayedHabits.length ? (
                  <>
                    {!!perWeekPointTarget &&
                      <View style={styles.pointsProgressContainer}>
                        {!today.after(selectedWeekDates[6]) && !today.before(selectedWeekDates[0]) && (
                          <View style={styles.pointsProgressTargetOuter}>
                            <View style={{ flexGrow: daysThisWeek }} />
                            <View style={styles.pointsProgressTarget}>
                              <View style={styles.pointsProgressTargetInner} />
                            </View>
                            <View style={{ flexGrow: 7 - daysThisWeek }} />
                          </View>
                        )}
                        {selectedWeekDates.map((date, index) => {
                          const dailyPoints = selectedWeekDailyHabitPointTotals[index];
                          const weeklyPoints = selectedWeekWeeklyHabitPointTotals[index];
                          
                          const isFuture = date.after(today);
                          const isSelected = date.equals(selectedDate);
                          const backgroundColor = isSelected ? globalPalette.primary : globalPalette.alt;
                          return isFuture ? null : (
                            <View key={date.toString()} style={[styles.pointsProgressBar, { flexGrow: dailyPoints + weeklyPoints }]}>
                              <View style={[styles.pointsProgressBarEnd, { left: -2, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]} />
                              <View style={[styles.pointsProgressBarEnd, { right: -2 }]} />
                              <View style={[styles.pointsProgressBarInner, { backgroundColor }]} />
                            </View>
                          );
                        })}
                        <View style={{
                          flexDirection: 'row',
                          flexBasis: 8,
                          flexGrow: Math.max(0, perWeekPointTarget - selectedWeekPointTotal),
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}>
                          <View style={{
                            flexGrow: 1,
                            height: 8,
                            borderRadius: 8,
                            backgroundColor: theme.colors.surfaceDisabled,
                          }} />
                        </View>
                      </View>
                    }
                    <View style={styles.weekPointsContainer}>
                      <Text variant='bodySmall' style={styles.weekPointsLabel}>Total</Text>
                      <Text variant='titleSmall'>{selectedWeekPointTotal}</Text>
                      <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
                      <Points size={'small'} points={perWeekPointTarget} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
                      <View style={{ flexGrow: 1 }} />
                      <Text variant='bodySmall' style={[styles.weekPointsLabel, { marginLeft: 16 }]}>Average</Text>
                      <Text variant='titleSmall'>{formatNumber(selectedWeekPointTotal / daysThisWeek, 1)}</Text>
                      <Text variant='bodySmall' style={styles.weekPointsDivider}>/</Text>
                      <Points size={'small'} points={perWeekPointTarget / 7} decimals={1} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
                    </View>
                  </>
                ) : null}
                <View style={styles.dailyPointTotalContainer}>
                  {selectedWeekDates.map((date, index) => {
                    const isToday = date.toString() === today.toString();
                    const daily = selectedWeekDailyHabitPointTotals[index] || 0;
                    const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
                    const total = daily + weekly;
                    const isSelected = index === selectedDayOfWeek;
                    const isFuture = date.after(today);
                    
                    const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
                    return (
                      <TouchableRipple
                        key={date.toString()}
                        style={[
                          styles.dailyPoints,
                          isSelected ? styles.dailyPointsSelected : {},
                          isToday ? styles.dailyPointsToday : {},
                        ]}
                        onPress={() => handleSelectedDateChange(date)}
                      >
                        <>
                          <View style={[styles.dailyPointsContainer, isToday ? styles.dailyPointsContainerToday : {}, isSelected ? styles.dailyPointsContainerSelected : {}]}>
                            <Text variant='bodySmall' style={{ ...styles.dailyPointDayOfWeek, color }}>{date.getDayOfWeekLabel().toUpperCase()}</Text>
                            {isFuture ? (
                              <View style={{ padding: 4 }}>
                                <Icon source={Icons.indeterminate} size={16} color={color} />
                              </View>
                            ) : (
                              <Points
                                style={styles.dailyPointTotal}
                                points={total}
                                size='medium'
                                disabled={!isSelected}
                                color={color}
                              />
                            )}
                          </View>
                        </>
                      </TouchableRipple>
                    )
                  })}
                </View> */}
                <View style={styles.dailyPointTotalContainer}>
              {selectedWeekDates.map((date, index) => {
                const isToday = date.toString() === today.toString();
                const daily = selectedWeekDailyHabitPointTotals[index] || 0;
                const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
                const total = daily + weekly;
                const isSelected = index === selectedDayOfWeek;
                const isFuture = date.after(today);
                                  
                const color = isSelected ? globalPalette.primary : theme.colors.onSurfaceDisabled;
                return (
                  <TouchableRipple
                    key={date.toString()}
                    style={[
                      styles.dailyPoints,
                      // isSelected ? styles.dailyPointsSelected : {},
                      isToday ? styles.dailyPointsToday : {},
                    ]}
                    onPress={() => handleSelectedDateChange(date)}
                  >
                    <>
                      <View style={[styles.dailyPointsContainer, isToday ? styles.dailyPointsContainerToday : {}, isSelected ? styles.dailyPointsContainerSelected : {}]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text variant='bodySmall' style={{ ...styles.dailyPointDayOfWeek, color }}>{date.getDayOfWeekLabel().toUpperCase()}</Text>
                        </View>

                        {isFuture ? (
                          <View style={{ padding: 3 }}>
                            <Icon source={Icons.indeterminate} size={16} color={color} />
                          </View>
                        ) : (
                          <Points
                          style={styles.dailyPointTotal}
                          points={total}
                          size='medium'
                          inline
                          disabled={!isSelected}
                          color={color}
                          />
                        )}
                      </View>
                    </>
                  </TouchableRipple>
                )
              })}
            </View>
              </View>
              
            )}
            <View style={styles.sectionContent}>
              {!!measurements.length && (
                <View style={styles.recordingView}>
                  {displayedHabits.length ? (
                    <>
                      {isReorderingHabits ? (
                        <NestableDraggableFlatList
                          data={habitPriorityOverrides || []}
                          onDragEnd={({ data }) => {
                            setHabitPriorityOverrides(data);
                          }}
                          keyExtractor={(id) => id}
                          activationDistance={forWeb(1, 20)}
                          renderItem={({ item: habitId, getIndex, drag, isActive }) => {
                            const habit = habits.find(({ id }) => id === habitId);
                            if (!habit) return;
      
                            return (
                              <ScaleDecorator activeScale={1.05}>
                                <RecordingDataHabit
                                  index={getIndex() || 0}
                                  habit={habit}
                                  date={selectedDate}
                                  weekDates={selectedWeekDates}
                                  measurements={measurements}
                                  recordingData={mergedRecordingsMap}
                                  onLongPress={forWeb(null, () => {
                                    if (isReorderingHabits) {
                                      drag();
                                      triggerHaptic('selection');
                                    }
                                  })}
                                  onPressIn={forWeb(() => isReorderingHabits && drag(), null)}
                                  disabled={isActive}
                                  reordering
                                />
                              </ScaleDecorator>
                            );
                          }}
                        />
                      ) : (
                        <>
                          {displayedHabits.map((habit, index) => {
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
                                onLongPress={(id) => {
                                  triggerHaptic('selection');
                                  router.push(`/habit/${id}`);
                                }}
                              />
                            );
                          })}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <View style={styles.noData}>
                        <View style={styles.noDataIcon}>
                          <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                        </View>
                        <Text style={styles.noDataText} variant='bodyLarge'>No active habits</Text>
                      </View>
                      {!habits.length && (
                        <Button
                          style={styles.noDataButton}
                          mode='contained'
                          onPress={() => { router.push('/habit/create'); }}
                        >
                          <Text variant='labelLarge' style={styles.noDataButtonText}>
                            Create your first habit
                          </Text>
                        </Button>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        </NestableScrollContainer>
        <BottomDrawer
          title='Create'
          visible={isAddMenuVisible}
          onDismiss={() => setIsAddMenuVisible(false)}
          anchor={
            <IconButton
              style={[globalStyles.elevation2, styles.createButton, ]}
              containerColor={globalPalette.primary}
              iconColor={theme.colors.inverseOnSurface}
              icon={Icons.add}
              size={18}
              onPress={() => setIsAddMenuVisible(true)}
            />
          }
          items={addMenuItems}
          onSelect={(item) => {
            setIsAddMenuVisible(false);
            setTimeout(() => {
              router.push(item.value === 'measurement' ? '/measurement/create' : '/habit/create');
            }, 0);
          }}
        />
      </View>
    </>
  );
}

const createStyles = (theme: MD3Theme, palette: Palette) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor: theme.dark ? palette.backdrop : theme.colors.surface,
    },
    headerCreateButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      margin: 0,
      marginRight: 14,
    },
    timelineContainer: {

      // marginHorizontal: 12,
      // paddingHorizontal: 12,
      paddingBottom: 8,
      // borderRadius: 20,
      backgroundColor: theme.dark ? palette.backdrop : theme.colors.elevation.level5,
      // borderBottomWidth: 1,
      // borderColor: theme.colors.elevation.level3,
      // position: 'relative',
      // backgroundColor: theme.colors.elevation.level3,
      // flexGrow: 0,
      // flexShrink: 0,
      // borderBottomWidth: 1,
      // borderColor: theme.colors.surfaceVariant,
      // width: '100%',
      // marginVertical: 8,
      // marginHorizontal: 16,
      // borderRadius: 24,
      // gap: 4,
      // paddingBottom: 40,
      // marginBottom: -28,
      // borderBottomLeftRadius: 20,
      // borderBottomRightRadius: 20,
    },
    timelineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    timelineHeaderButton: {
      margin: 0,
      borderRadius: 16,
    },
    timeHeaderText: {
      flexGrow: 1,
      textAlign: 'center',
      color: theme.colors.onSurfaceDisabled,
    },
    timelineContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 8,
      paddingHorizontal: 8,
      flexGrow: 1,
      flexShrink: 0,
      alignItems: 'stretch',
      width: '100%',
      paddingTop: 2,
      paddingBottom: 10,
      // marginBottom: -8,
    },
    timelineDate: {
      flexBasis: 100,
      flexShrink: 1,
      // paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 15,
      overflow: 'hidden',
    },
    timelineDateToday: {},
    timelineDateSelected: {
      backgroundColor: 'transparent',
      // backgroundColor: theme.colors.surfaceDisabled,
    },
    timelineDateContainer: {
      flexGrow: 1,
      borderRadius: 15,

      justifyContent: 'center',
      alignSelf: 'stretch',
      alignItems: 'stretch',
      gap: 4,

      overflow: 'hidden',
    },
    timelineDateContainerToday: {},
    timelineDateContainerSelected: {},
    timelineDateContent: {
      borderRadius: 19,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 1,
      borderWidth: 0,
    },
    timelineDateContentToday: {},
    timelineDateContentSelected: {},
    timelineDateDayOfWeek: {
      textAlign: 'center',
      color: theme.colors.onSurfaceDisabled,
      fontSize: 12,
    },
    timelineDateDayOfWeekToday: {},
    timelineDateDayOfWeekSelected: {
      // color: palette.primary,
      // color: palette.secondary,
      color: theme.colors.onSurface,
    },
    timelineDateDay: {
      textAlign: 'center',
      color: theme.colors.onSurfaceDisabled,
      fontSize: 20,
      lineHeight: 24,
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      gap: 4,
    },
    timelineDateDayToday: {},
    timelineDateDaySelected: {
      color: theme.colors.onSurface,
      // color: palette.secondary,
      // color: palette.primary,
    },
    timelineDateIcon: {
      marginTop: 4,
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
    },
    todayIndicator: {
      marginRight: 2,
      width: 5,
      height: 5,
      borderRadius: 4,
      backgroundColor: theme.colors.onSurfaceDisabled,
      transform: [{ translateX: -2 }],
    },
    todayIndicatorToday: {
      backgroundColor: palette.primary,
    },
    measurementsProgressBar: {
      height: 8,
      borderRadius: 8,
      width: '100%',
      backgroundColor: theme.colors.surfaceDisabled,
      overflow: 'hidden',
    },
    measurementsProgressBarSelected: {
      // height: 10,
      // flexDirection: 'row',
      // gap: 2,
      // backgroundColor: 'none',
    },
    measurementsProgressPiece: {
      // height: 10,
      flexShrink: 1,
      width: '100%',
      // borderRadius: 100,
    },
    pointsProgressContainer: {
      marginHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
      borderRadius: 100,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceDisabled,
      height: 6,
    },
    pointsProgressBar: {
      position: 'relative',
      height: 6,
      // borderRadius: 8,
      flexBasis: 0,
    },
    pointsProgressBarInner: {
      flexGrow: 1,
      alignSelf: 'stretch',
      // borderRadius: 8,
      // borderTopLeftRadius: 0,
      // borderBottomLeftRadius: 0,
    },
    pointsProgressBarEnd: {
      position: 'absolute',
      top: -2,
      height: 12,
      width: 12,
      borderRadius: 12,
      zIndex: -1,
      // backgroundColor: palette.backdrop,
      // backgroundColor: 'red',
      // backgroundColor: theme.colors.elevation.level3,
    },
    pointsProgressBarBackdrop: {
      position: 'absolute',
      top: 0,
      height: 8,
      width: '100%',
      // borderRadius: 8,
      // borderTopLeftRadius: 0,
      // borderBottomLeftRadius: 0,
      zIndex: -1,
      backgroundColor: palette.backdrop,
      // backgroundColor: theme.colors.elevation.level3,
    },
    pointsProgressTargetOuter: {
      flexDirection: 'row',
      height: 6,
      width: '100%',
      position: 'absolute',
      top: 0,
      zIndex: 1,
    },
    pointsProgressTarget: {
      height: 6,
      width: 2,
      borderRadius: 0,
      backgroundColor: palette.backdrop,
      // backgroundColor: theme.colors.elevation.level3,
      justifyContent: 'center',
      flexGrow: 0,
    },
    pointsProgressTargetInner: {
      // top: 16,
      // width: 4,
      // height: 4,
      // borderRadius: 2,
      // backgroundColor: palette.primary,
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
    },
    weekPointsContainer: {
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      marginHorizontal: 16,
      marginVertical: 4,
      // justifyContent: 'flex-start',
      gap: 6,
    },
    weekPointsLabel: {
      // color: theme.colors.onSurfaceDisabled,
    },
    weekPointsDivider: {},
    content: {
      paddingBottom: 80,
    },
    section: {
      margin: 8,
      borderRadius: 20,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      backgroundColor: theme.colors.elevation.level2,
      // backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderColor: theme.colors.elevation.level5,
      marginTop: -1,
      gap: 4,
    },
    sectionHeaderIcon: {
      marginLeft: 8,
    },
    sectionHeaderTitle: {
      flex: 1,
    },
    sectionHeaderButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      margin: 0,
      marginRight: 0,
    },
    sectionContent: {},
    recordingView: {},
    measurementDailyProgress: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      rowGap: 4,
    },
    measurementDailyProgressIcon: {
      paddingVertical: 2,
    },
    measurementsStatusContainer: {
      width: '100%',
      marginBottom: 4,
      // marginTop: -4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      gap: 16,
      // paddingHorizontal: 8,
    },
    measurementsStatus: {
      // paddingVertical: 6,
      width: '100%',
      flexShrink: 1,
      alignItems: 'center',
      overflow: 'hidden',
      // flexDirection: 'row',
      // justifyContent: 'center',
      gap: 4,
    },
    measurementsStatusSelected: {
      // flexShrink: 0.9,
    },
    dailyPointTotalContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      gap: 8,
    },
    dailyPoints: {
      paddingVertical: 8,
      width: '100%',
      flexShrink: 1,
      alignItems: 'stretch',
      borderRadius: 16,
      overflow: 'hidden',
    },
    dailyPointsSelected: {
      backgroundColor: theme.colors.elevation.level4,
    },
    dailyPointsToday: {},
    dailyPointsContainer: {
      alignItems: 'center',
    },
    dailyPointsContainerToday: {},
    dailyPointsContainerSelected: {},
    dailyPointDayOfWeek: {},
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
    noDataButton: {
      alignSelf: 'center',
      marginBottom: 24,
    },
    noDataButtonText: {
      paddingHorizontal: 4,
      color: theme.colors.surface,
    },
    createButtonContainer: {
      position: 'absolute',
      bottom: 16,
      right: 24,
    },
    createButton: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      margin: 0,
      height: 48,
      width: 48,
      borderRadius: 16,
      backgroundColor: palette.primary,
    },
    createButtonContent: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: 56,
      height: 56,
      alignItems: 'center',
      gap: 4,
    },
    createButtonText: {
      color: theme.colors.onSurface,
    },
  });
};

export default Recordings;

type RecordingMeasurementItemProps = {
  index: number,
  measurement: Measurement,
  currentDate: SimpleDate,
  weekMeasurementValues: (number | null)[],
  mergedRecordingValues?: Map<string, Map<string, number | null>>,
  expanded?: boolean,
  onValueChange?: (nextValue: number | null) => void,
  onPress?: (id: string) => void,
  onLongPress?: (id: string) => void,
  onPressIn?: (id: string) => void,
  disabled?: boolean,
  reordering?: boolean,
}

const RecordingMeasurementItem = (props : RecordingMeasurementItemProps) : JSX.Element | null  => {
  const {
    index,
    measurement,
    currentDate,
    weekMeasurementValues,
    mergedRecordingValues,
    expanded,
    onValueChange,
    onPress,
    onLongPress,
    onPressIn,
    disabled,
    reordering,
  } = props;
  const theme = useTheme();
  const typeData = getMeasurementTypeData(measurement.type);
  const measurements = useMeasurements();
  if (!typeData) return null;
  
  const isDuration = measurement.type === 'duration';
  const isBool = measurement.type === 'bool';
  const isTime = measurement.type === 'time';
  const isCombo = measurement.type === 'combo';

  const startDate = getMeasurementStartDate(measurement.id, measurements, mergedRecordingValues);
  const today = SimpleDate.today();
  
  const longPressLeftInterval = useRef<null | NodeJS.Timeout>(null);
  const longPressRightInterval = useRef<null | NodeJS.Timeout>(null);

  const value = weekMeasurementValues[currentDate.getDayOfWeek()];
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleLongPressLeft = () => {
    if (!onValueChange) return;
    longPressLeftInterval.current = setInterval(() => {
      onValueChange(valueRef.current === null ? measurement.initial : valueRef.current - measurement.step);
    }, 125);
  }
  const handleLongPressRight = () => {
    if (!onValueChange) return;
    longPressRightInterval.current = setInterval(() => {
      onValueChange(valueRef.current === null ? measurement.initial : valueRef.current + measurement.step);
    }, 125);
  }

  const { getPalette, getCombinedPalette, globalPalette } = usePalettes();
  const measurementPalette = getPalette(measurement.baseColor);
  const combinedPalette = getCombinedPalette(measurement.baseColor);
  const styles = createMeasurementStyles(theme, measurementPalette, combinedPalette, index);

  const renderControlContent = () => {
    if (isBool) {
      return (
        <>
          {value !== null && (
            <TouchableRipple style={styles.value} onLongPress={() => onValueChange ? onValueChange(null) : null} delayLongPress={600} disabled={isCombo}>
              <Icon source={value ? Icons.complete : Icons.incomplete} color={combinedPalette.primary} size={18} />
            </TouchableRipple>
          )}
          <View style={styles.controls}>
            <IconButton
              style={styles.controlButton}
              size={16}
              icon={Icons.incomplete}
              onPress={() => {
                onValueChange ? onValueChange(0) : null;
              }}
              />
            <IconButton
              style={styles.controlButton}
              size={16}
              icon={Icons.complete}
              onPress={() => {
                onValueChange ? onValueChange(1) : null;
              }}
            />
          </View>
        </>
      );
    } else {
      const valueString = formatValue(value, measurement.type, measurement.unit, true);
      return (
        <>
          {!!valueString && (
            <TouchableRipple style={styles.value} onLongPress={() => onValueChange ? onValueChange(null) : null} delayLongPress={600} disabled={isCombo}>
              <Text style={styles.valueText} variant='titleMedium'>{valueString}</Text>
            </TouchableRipple>
          )}
          {isCombo ? <View style={{ ...styles.controls, marginRight: -16 }} /> : (
            <View style={styles.controls}>
              <IconButton
                style={styles.controlButton}
                size={18}
                icon={Icons.subtract}
                disabled={(!isTime && value === 0)}
                onPress={() => {
                  onValueChange ? onValueChange(value === null ? measurement.initial : value - measurement.step) : null;
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
                icon={Icons.add}
                onPress={() => {
                  onValueChange ? onValueChange(value === null ? measurement.initial + measurement.step : value + measurement.step) : null;
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
      (
        <View key={'completion'} style={styles.completionContent}>
          <View style={styles.completionStatuses}>
            {weekMeasurementValues.map((value, index) => {
              const date = currentDate.getDaysAgo(currentDate.getDayOfWeek() - index);
              const isFuture = date.after(today);
              const isSelected = index === currentDate.getDayOfWeek();
              const hasNotStarted = !startDate || startDate > date.toString();

              return (
                <View key={date.toString()} style={styles.completionStatus}>
                  {isFuture || hasNotStarted ? (
                    <Icon source={Icons.indeterminate} size={14} color={isSelected ? combinedPalette.primary : theme.colors.surfaceDisabled} />
                  ) : (
                  <Icon
                    source={value === null ? Icons.progressNone : Icons.progressComplete}
                    size={14}
                    color={isSelected ? combinedPalette.primary : isFuture ? theme.colors.surfaceDisabled : combinedPalette.backdrop}
                  />)}
                </View>
              );
            })}
          </View>
          <View style={styles.aggregateContent}>
            {isTime ? null : (<View style={styles.aggregateMetric}>
              <Text variant='bodySmall' style={styles.aggregateMetricLabel}>
                Total
              </Text>
              <Text variant='titleSmall' style={styles.aggregateMetricValue}>
                {count ? totalString : '--'}
              </Text>
            </View>)}
            <View style={styles.aggregateMetric}>
              <Text variant='bodySmall' style={styles.aggregateMetricLabel}>
                Average
              </Text>
              <Text variant='titleSmall' style={styles.aggregateMetricValue}>
                {count ? averageString : '--'}
              </Text>
            </View>
          </View>
        </View>
      ),
    ];
  }


  return (
    <TouchableRipple
      style={[styles.container, reordering && { backgroundColor : theme.colors.surface }]}
      onPress={() => onPress ? onPress(measurement.id) : null}
      onLongPress={() => onLongPress ? onLongPress(measurement.id) : null}
      onPressIn={() => onPressIn ? onPressIn(measurement.id) : null}
      delayLongPress={300}
      disabled={disabled}
    >
      <>
        <View style={[styles.content]}>
          <View style={styles.label}>
            {!!measurement.baseColor && <View style={styles.colorSwatch} />}
            <Text numberOfLines={1} ellipsizeMode="tail" variant='titleMedium' style={styles.labelActivity}>{measurement.name}</Text>
            {measurement.variant ? (
              <>
                <Text variant='bodyLarge' style={styles.labelDivider}> : </Text>
                <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={[styles.labelVariant]}>{measurement.variant}</Text>
              </>
            ) : null}
          </View>
          {!reordering && renderControlContent()}
        </View>
        {renderExpandedContent()}
      </>
    </TouchableRipple>
  );
}

const createMeasurementStyles = (theme: MD3Theme, measurementPalette: Palette, combinedPalette: Palette, index: number) => StyleSheet.create({
  container: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.elevation.level3,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: index === 0 ? 0 : -1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    gap: 8,
  },
  label: {
    flexShrink: 1,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  colorSwatch: {
    height: 8,
    width: 15,
    borderRadius: 4,
    backgroundColor: measurementPalette.primary,
    marginRight: 8,
  },
  typeIconContainer: {
    paddingVertical: 6,
    marginLeft: 0,
    marginRight: 8,
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
    flexShrink: 0,
    textAlign: 'right',
    alignItems: 'flex-end',
    justifyContent: 'center',

    height: 40,
    minWidth: 40,

    paddingHorizontal: 16,
    borderRadius: 12,
  },
  valueText: {
    color: combinedPalette.primary,
  },
  controls: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    margin: 0,
    marginHorizontal: -2,
    marginVertical: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -6,
  },
  completionStatuses: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 12,
  },
  completionStatus: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
  },
  aggregateContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    paddingRight: 4,
  },
  aggregateMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
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
  expanded?: boolean,
  recordingData:  Map<string, Map<string, number | null>>,
  onPress?: (id: string) => void,
  onPressIn?: (id: string) => void,
  onLongPress?: (id: string) => void,
  disabled?: boolean,
  reordering?: boolean,
}

const RecordingDataHabit = (props : RecordingDataHabitProps) : JSX.Element | null => {
  const { habit, index, date, weekDates, measurements, expanded, recordingData, onPress, onPressIn, onLongPress, disabled, reordering } = props;

  const theme = useTheme();
  const { getCombinedPalette } = usePalettes();
  const combinedPalette = getCombinedPalette(habit.baseColor);
  const styles = createHabitStyles(theme, combinedPalette, index);

  const today = SimpleDate.today();
  const isFuture = date.after(SimpleDate.today());
  // const dayRecordings = getDateRecordings(measurements, date);
  // const weekRecordings = weekDates.map((weekDate) => getDateRecordings(measurements, weekDate));

  const firstWeeklyCompletionIndex = habit.isWeekly ? range(0, 7).map((_, index) => {
    const [complete] = getHabitCompletion(habit, measurements, weekDates.slice(0, index + 1), recordingData);
    return complete;
  }).findIndex((completion) => completion) : -1;

  const renderCompletionContent = () => {
    return (
      <View style={styles.completionContent}>
        {weekDates.map((weekDate, index) => {
          const dates = habit.isWeekly ? weekDates : [weekDate];
          const [complete] = getHabitCompletion(habit, measurements, dates, recordingData);
          
          const isSelected = index === date.getDayOfWeek();
          const isFuture = weekDate.after(today);
          let source = Icons.progressNone;
          let color = combinedPalette.backdrop;
          let size = 14;
          if (isFuture) {
            color = theme.colors.surfaceDisabled;
            source = Icons.indeterminate;
            size = 14;
          } else if (habit.isWeekly && firstWeeklyCompletionIndex !== -1) {
            if (index === firstWeeklyCompletionIndex) {
              source = Icons.progressComplete;
            } else if (index !== firstWeeklyCompletionIndex) {
              source = Icons.indeterminate;
              size = 14;
            }
          } else if (complete) {
            color = combinedPalette.backdrop;
            source = Icons.progressComplete;
          }
          
          if (isSelected) {
            color = combinedPalette.primary;
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
    )
  };

  const dates = weekDates.slice(habit.isWeekly ? 0 : date.getDayOfWeek(), date.getDayOfWeek() + 1);
  const [complete, conditionCompletions, conditionValues, conditionProgressions] = getHabitCompletion(habit, measurements, dates, recordingData);
  const renderConditionContent = () => {
    return (
      <View style={styles.conditionContent}>
        {habit.conditions.map(({ target, measurementId, operator }, index) => {
          const measurement = measurements.find(({ id }) => id === measurementId);
          if (!measurement) return null;

          const palette = getCombinedPalette(measurement.baseColor || habit.baseColor);

          const isBool = measurement.type === 'bool';

          const conditionCompletion = conditionCompletions[index];
          const conditionValue = conditionValues[index];
          const conditionProgress = conditionProgressions[index];

          const valueString = conditionValue === null ? '-' : formatValue(conditionValue, measurement.type, measurement.unit, false);
          const targetString = formatValue(target, measurement.type, measurement.unit, true);

          const progressLabelColor = theme.colors.onSurface;
          const progressColor = conditionCompletion ? palette.backdrop : palette.disabled;
          return (
            <View key={`${measurementId}${operator}${target}`} style={styles.condition}>
              <View style={styles.conditionMeasurement}>
                {!!measurement.baseColor && <View style={[styles.conditionColorSwatch, { backgroundColor: palette.primary }]} />}
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
                    source={conditionValue ? Icons.complete : Icons.incomplete}
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
                    source={operator === '==' ? Icons.complete : Icons.incomplete}
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
              </View>
            </View>
          );
        })}
      </View>
    )
  }

  return (
    <TouchableRipple
      style={[styles.container, reordering && { backgroundColor : theme.colors.surface }]}
      onPress={() => onPress ? onPress(habit.id) : null}
      onPressIn={() => onPressIn ? onPressIn(habit.id) : null}
      onLongPress={() => onLongPress ? onLongPress(habit.id) : null}
      delayLongPress={300}
      disabled={disabled}
    >
      <>
        <View style={[styles.content]}>
          {!!habit.baseColor && <View style={styles.colorSwatch} />}
          <Text variant='titleMedium'>{habit.name}</Text>
          <View style={styles.scopeTag}>
            <Text variant='bodySmall' style={styles.scopeTagText}>
              {habit.isWeekly ? 'WEEKLY' : `DAILY x${habit.daysPerWeek}`}
            </Text>
          </View>
          {isFuture || reordering ? null : (
            <View style={styles.dayCompletion}>
              {habit.conditions.length > 1 && (
                <View style={styles.predicate}>
                  <Icon source={getHabitPredicateIcon(habit.predicate)} size={14} color={complete ? combinedPalette.primary : combinedPalette.disabled} />
                  <Text style={[styles.predicateLabel, complete ? styles.predicateLabelComplete : {}]} variant='bodyLarge'>{getHabitPredicateLabel(habit.predicate)}</Text>
                </View>
              )}
              {habit.conditions.map((condition, index) => {
                const conditionCompletion = conditionCompletions[index];
                const measurement = measurements.find(({ id }) => id === condition.measurementId);
                const palette = getCombinedPalette(measurement?.baseColor || habit.baseColor);
                return (
                  <View key={condition.measurementId} style={[styles.dayCompletionIcon, conditionCompletion ? styles.dayCompletionIconComplete : {}]}>
                    <Icon
                      source={conditionCompletion ? Icons.progressComplete : Icons.progressNone}
                      color={complete ? palette.primary : conditionCompletion ? palette.backdrop : palette.disabled}
                      size={12}
                    />
                  </View>
                )
              })}
              <Points
                style={[styles.dayCompletionPoints]}
                size='medium'
                points={habit.points}
                color={complete ? combinedPalette.primary : theme.colors.onSurfaceDisabled}
              />
            </View>
          )}
        </View>
        {expanded && (
          <>
            {renderConditionContent()}
            {renderCompletionContent()}
          </>
        )}
      </>
    </TouchableRipple>
  );
}

const createHabitStyles = (theme: MD3Theme, habitPalette: Palette, index: number) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.elevation.level3,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: index === 0 ? 0 : -1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  colorSwatch: {
    height: 8,
    width: 15,
    borderRadius: 4,
    backgroundColor: habitPalette.primary,
  },
  scopeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.elevation.level4,
    borderRadius: 6,
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
    marginLeft: 8,
  },
  predicate: {
    flexDirection: 'row',
    alignItems: 'center',  
    gap: 4,
  },
  predicateLabel: {
    color: habitPalette.disabled,
    textTransform: 'uppercase',
  },
  predicateLabelComplete: {
    color: habitPalette.primary,
  },
  conditionContent: {
    paddingHorizontal: 4,
  },
  condition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 4,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  conditionColorSwatch: {
    height: 6,
    width: 11,
    borderRadius: 3,
  },
  conditionMeasurement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  conditionProgressBarComplete: {
  },
  conditionProgressLabel: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  conditionProgressCurrent: {
    textAlign: 'right',
  },
  conditionProgressDivider: {
    marginHorizontal: 1,
  },
  conditionProgressTarget: {

  },
  conditionProgress: {
    width: '100%',
  },
  conditionProgressBar: {
    height: 6,
    borderRadius: 200,
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 12,
  },
  completionIcon: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
});
