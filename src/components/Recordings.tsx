import { Animated, FlatList, Keyboard, PixelRatio, Platform, ScrollView, StatusBar, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { useComputedHabits, useHabitStatus, useHasNonStandardRewardHabit, useMeasurements, useMeasurementStatus } from '@s/selectors';
import { getMeasurementRecordingValue, getMeasurementStartDate, getMeasurementTypeData, type Measurement } from '@t/measurements';
import { Button, Icon, IconButton, Modal, Portal, Text, TextInput, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimpleDate } from '@u/dates';
import { getHabitCompletion, getHabitPredicateLabel, type ComputedHabit } from '@t/habits';
import { computeTimeValue, formatTimeValue, formatValue, intersection, parseTimeString, range, triggerHaptic } from '@u/helpers';
import Points from '@c/Points';
import { Icons } from '@u/constants/Icons';
import { callUpdateHabit, callUpdateHabits, callUpdateMeasurement, callUpdateMeasurements } from '@s/dataReducer';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import BottomDrawer, { type BottomDrawerItem } from '@c/BottomDrawer';
import Status from '@u/constants/Status';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { type Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { useAnimatedRef } from 'react-native-reanimated';
import useDimensions from '@u/hooks/useDimensions';
import AnimatedView from '@c/AnimatedView';
import ArchedProgressBar from '@c/ArchedProgress';
import DraggableList from '@c/DraggableList';
import CircularProgress from '@c/CircularProgress';
import { Pressable } from 'react-native-gesture-handler';
import { useToday } from '@u/hooks/useToday';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QuickStartButton from '@c/QuickStartButton';
import { HabitLabel, MeasurementLabel } from '@c/Label';
import { TabView } from 'react-native-tab-view';


const Recordings = () => {
  const theme = useTheme();
  const { baseColor, globalPalette, basePalette } = usePalettes();
  const styles = useMemo(() => createStyles(theme, globalPalette), [theme, globalPalette]);
  const { top } = useSafeAreaInsets();

  const measurements = useMeasurements();

  const habits = useComputedHabits();
  const hasNonStandardRewardHabit = useHasNonStandardRewardHabit();
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const dailyHabits = useMemo(() => activeHabits.filter((h) => !h.isWeekly), [activeHabits]);
  const weeklyHabits = useMemo(() => activeHabits.filter((h) => h.isWeekly), [activeHabits]);

  const today = useToday();

  const [selectedDate, setSelectedDate] = useState((new Date()).getHours() >= 3 ? today : today.getDaysAgo(1));
  const selectedDayOfWeek = selectedDate.getDayOfWeek();
  const selectedWeekDates = useMemo(() => SimpleDate.generateWeek(selectedDate), [selectedDate]);
  const isToday = selectedDate.equals(today);

  const [showArchivedMeasurements, setShowArchivedMeasurements] = useState(false);
  const [isReorderingMeasurements, setIsReorderingMeasurements] = useState(false);
  const [measurementPriorityOverrides, setMeasurementPriorityOverrides] = useState<string[] | null>(null);

  const orderedMeasurements = measurementPriorityOverrides?.length
  ? measurementPriorityOverrides
    .map((overrideId) => measurements.find(({ id }) => id === overrideId))
    .filter((m) => !!m)
  : measurements;

  const displayedMeasurements = useMemo(
    () => orderedMeasurements.filter(m => !m.archived || showArchivedMeasurements),
    [orderedMeasurements, showArchivedMeasurements]
  );
  const [expandedMeasurements, setExpandedMeasurements] = useState(new Set());
  const displayedMeasurementIds = displayedMeasurements.map(({ id }) => id);
  const displayedExpandedMeasurements = intersection(expandedMeasurements, new Set(displayedMeasurementIds));
  const areAllMeasurementsExpanded = displayedExpandedMeasurements.size === displayedMeasurements.length;

  const submitMeasurementOrder = useCallback(() => {
    if (!measurementPriorityOverrides || !measurementPriorityOverrides.length) return;

    const updatedMeasurements: Measurement[] = [];
    measurements.forEach((measurement) => {
      const nextPriority = measurementPriorityOverrides.findIndex((id) => id === measurement.id);
      if (measurement.priority === nextPriority) return;

      updatedMeasurements.push({ ...measurement, priority: nextPriority });
    });

    if (!updatedMeasurements.length) return;
    dispatch(callUpdateMeasurements(updatedMeasurements));
  }, [measurements, measurementPriorityOverrides]);

  const toggleMeasurementArchived = (measurement: Measurement, archived: boolean) => {
    const updatedMeasurement = { ...measurement, archived };
    dispatch(callUpdateMeasurement(updatedMeasurement));
  }

  const measurementMenuItems: BottomDrawerItem<string>[] = [
    {
      icon: Icons.add,
      title: 'CREATE',
      value: 'create',
      // subtitle: 'Define a new measurement.',
    },
    {
      icon: Icons.move,
      title: 'REORDER',
      value: 'reorder',
      // subtitle: isReorderingMeasurements ? 'Disable drag and drop mode.' : 'Enable drag and drop mode.',
    },
    {
      icon: Icons.show,
      title: `HIDE / SHOW`,
      // subtitle: showArchivedMeasurements ? `Disable archiving mode.` : 'Enable archiving mode.',
      value: 'visibility',
    },
    {
      icon: Icons.expand,
      title: `EXPAND ALL`,
      // subtitle: `Show all expanded content.`,
      value: 'expand',
    },
    {
      icon: Icons.collapse,
      title: `COLLAPSE ALL`,
      // subtitle: `Hide all expanded content.`,
      value: 'collapse',
    },
    {
      icon: Icons.delete,
      title: `RESET DAY`,
      // subtitle: `Delete recorded values for the current day.`,
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

  const submitHabitOrder = useCallback(() => {
    if (!habitPriorityOverrides || !habitPriorityOverrides.length) return;

    const updatedHabits: ComputedHabit[] = [];
    habits.forEach((habit) => {
      const nextPriority = habitPriorityOverrides.findIndex((id) => id === habit.id);
      if (habit.priority === nextPriority) return;

      updatedHabits.push({ ...habit, priority: nextPriority });
    });

    if (!updatedHabits.length) return;
    dispatch(callUpdateHabits(updatedHabits));
  }, [habits, habitPriorityOverrides]);

  const toggleHabitArchived = (habit: ComputedHabit, archived: boolean) => {
    const updatedHabit = { ...habit, archived };
    dispatch(callUpdateHabit(updatedHabit));
  }

  const habitMenuItems: BottomDrawerItem<string>[] = [
    {
      icon: Icons.add,
      title: 'CREATE',
      value: 'create',
      // subtitle: 'Define a new habit.',
    },
    {
      icon: Icons.move,
      title: 'REORDER',
      value: 'reorder',
      // subtitle: isReorderingHabits ? 'Disable drag and drop mode.' : 'Enable drag and drop mode.',
    },
    {
      icon: Icons.show,
      title: `SHOW / HIDE`,
      // subtitle: showArchivedHabits ? `Disable archiving mode.` : 'Enable archiving mode.',
      value: 'visibility',
    },
    {
      icon: Icons.expand,
      title: `EXPAND ALL`,
      // subtitle: `Show all expanded content.`,
      value: 'expand',
    },
    {
      icon: Icons.collapse,
      title: `COLLAPSE ALL`,
      // subtitle: `Hide all expanded content.`,
      value: 'collapse',
    },
    {
      icon: Icons.delete,
      title: `RESET DAY`,
      // subtitle: `Delete recorded values for the current day.`,
      value: 'reset',
    },
  ];
  const addMenuItems: BottomDrawerItem<string>[] = useMemo(() => [
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
  ], [measurements.length]);

  const [tempRecordingsMap, setTempRecordingsMap] = useState<Map<string, Map<string, number | null>>>(new Map());
  const mergedRecordingsMap = useMemo(() => {
    const result = new Map(measurements.map(({ id, recordings}) => [
      id,
      new Map<string, number | null>(recordings.map(({ date, value }) => [
        date,
        value,
      ])),
    ]));

    [...tempRecordingsMap.entries()].forEach(([id, recordingsMap]) => {
      const mergedRecordings = result.get(id) || new Map<string, number | null>();
      [...recordingsMap.entries()].forEach(([date, value]) => {
        mergedRecordings.set(date, value);
      });
      result.set(id, mergedRecordings);
    });

    return result;
  }, [measurements, tempRecordingsMap]);
  

  const selectedWeekHabitCompletionMaps = [
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
    new Map<string, boolean>(),
  ];
  const selectedWeekDailyHabitPointTotals = useMemo(() => selectedWeekDates.map((date, index) => {
    return date.after(today) ? 0 : dailyHabits.reduce((previous: number, habit: ComputedHabit) => {
      const [complete, points, _, __] = getHabitCompletion(habit, measurements, [date], mergedRecordingsMap);  
      selectedWeekHabitCompletionMaps[index].set(habit.id, complete);
      return previous + points;
    }, 0);
  }), [selectedWeekDates, today, dailyHabits, measurements, mergedRecordingsMap]);
  
  const selectedWeekWeeklyHabitPointTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    weeklyHabits.forEach((habit) => {
      selectedWeekDates.filter((date) => !date.after(today)).find((_, index) => {
        const dates = selectedWeekDates.slice(0, index + 1);
        const [complete, points] = getHabitCompletion(habit, measurements, dates, mergedRecordingsMap);
        selectedWeekHabitCompletionMaps[index].set(habit.id, complete);

        totals[index] += points;
        if (index) {
          const [_, previousPoints] = getHabitCompletion(habit, measurements, selectedWeekDates.slice(0, index), mergedRecordingsMap);
          totals[index] -= previousPoints;
        }
        return complete;
      });
    });
    return totals;
  }, [selectedWeekDates, today, weeklyHabits, measurements, mergedRecordingsMap]);

  const selectedWeekHabitPointTotals = useMemo(
    () => selectedWeekWeeklyHabitPointTotals.map((curr, index) => curr + (selectedWeekDailyHabitPointTotals[index] || 0)),
    [selectedWeekWeeklyHabitPointTotals, selectedWeekDailyHabitPointTotals]
  );

  const selectedWeekPointTotal = selectedWeekHabitPointTotals.reduce((acc, curr) => acc + curr, 0);
  const perWeekPointTarget = activeHabits.reduce((previous: number, current: ComputedHabit) => {
    return previous + current.points * (current.isWeekly ? 1 : current.daysPerWeek);
  }, 0);

  const daysThisWeek = Math.min(SimpleDate.daysBetween(today, selectedWeekDates[0]) + 1, 7);

  const selectedWeekMeasurementValues = useMemo(() => {
    const valueMap = new Map<string, (number | null)[]>();
    measurements.forEach(({ id }) => {
      const values = selectedWeekDates.map((date) => {
        return getMeasurementRecordingValue(id, date, measurements, mergedRecordingsMap);
      });
      valueMap.set(id, values);
    });
    return valueMap;
  }, [measurements, selectedWeekDates, mergedRecordingsMap]);

  const dispatch = useDispatch();
  const submitRecordingUpdatesTimeout = useRef<null | NodeJS.Timeout>(null);
  const pendingRecordingUpdates = useRef<null | Map<string, Map<string, number | null>>>(null);
  const submitRecordingUpdates = useCallback(() => {
    if (!pendingRecordingUpdates.current) return;

    const updatedMeasurements: Measurement[] = [];
    [...pendingRecordingUpdates.current.entries()].forEach(([measurementId, recordingsMap]) => {
      const measurement = measurements.find((m) => m.id === measurementId);
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
    pendingRecordingUpdates.current = null;
  }, [measurements, dispatch]);

  const updateRecording = useCallback((value: number | null, measurement: Measurement, date: string) => {
    setTempRecordingsMap(() => {
      const nextTempRecordingsMap = new Map([...tempRecordingsMap.entries()].map(([ id, recordingsMap]) => [
        id,
        new Map([...recordingsMap.entries()]),
      ]));
  
      const recordingsMap = nextTempRecordingsMap.get(measurement.id) || new Map<string, number | null>();
      recordingsMap.set(date, value);
      nextTempRecordingsMap.set(measurement.id, recordingsMap);
  
      pendingRecordingUpdates.current = nextTempRecordingsMap;
      if (submitRecordingUpdatesTimeout.current) clearTimeout(submitRecordingUpdatesTimeout.current);
      submitRecordingUpdatesTimeout.current = setTimeout(() => {
        submitRecordingUpdates();
      }, 1000);

      return nextTempRecordingsMap;
    });
  }, [submitRecordingUpdatesTimeout, tempRecordingsMap, setTempRecordingsMap, submitRecordingUpdates]);

  const updateNote = useCallback((content: string | null, measurement: Measurement, date: string) => {
    const nextNotes = [...(measurement.notes || [])];
    const noteIndex = nextNotes.findIndex((n) => n.date === date);
    
    let updateNeeded = false;
    if (content) {
      if (noteIndex === -1) {
        nextNotes.push({ date, content });
        updateNeeded = true;
      } else if (nextNotes[noteIndex].content !== content) {
        nextNotes.splice(noteIndex, 1, { date, content });
        updateNeeded = true;
      }
    } else if (noteIndex !== -1) {
      nextNotes.splice(noteIndex, 1);
      updateNeeded = true;
    }

    if (updateNeeded) dispatch(callUpdateMeasurement({ ...measurement, notes: nextNotes }));
  }, [dispatch]);

  const clearRecordings = (date = selectedDate) => {
    setTempRecordingsMap(new Map());
    if (submitRecordingUpdatesTimeout.current) clearTimeout(submitRecordingUpdatesTimeout.current);

    const updatedMeasurements: Measurement[] = [];
    measurements.forEach((measurement) => {
      const nextRecordings = measurement.recordings.filter((recording) => recording.date !== date.toString());
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
    handleDateSelection(nextSelectedDate, false);
    
    const nextDelay = Math.max(delay - 25, 100);
    longPressPreviousTimeout.current = setTimeout(() => handleLongPressPrevious(nextSelectedDate, nextDelay), delay);
  }
  
  const handleLongPressNext = (selectedDate: SimpleDate, delay: number = 250) => {
    triggerHaptic('impact', ImpactFeedbackStyle.Light);
    const nextSelectedDate = selectedDate.getDaysAgo(-7);
    handleDateSelection(nextSelectedDate, false);
    
    const nextDelay = Math.max(delay - 25, 100);
    longPressNextTimeout.current = setTimeout(() => handleLongPressNext(nextSelectedDate, nextDelay), delay);
  }
  
  const timelineFlatListRef = useAnimatedRef<FlatList<{ week: { dates: SimpleDate[] }, elements: JSX.Element[] }>>();
  const weeks = useMemo(() => range(-52, 53).map((i) => ({ dates: SimpleDate.generateWeek(today.getDaysAgo(-7 * i)) })), [today]);

  const handleDateSelection = (date: SimpleDate, updateState: boolean = true) => {
    const firstDate = weeks[0].dates[0];
    const delta = SimpleDate.daysBetween(date, firstDate);
    const weekIndex = Math.floor(delta / 7);
    timelineFlatListRef.current?.scrollToIndex({ index: weekIndex });
    updateState && setSelectedDate(date);
  }

  const { window: dimensions } = useDimensions();
  const timelineHeight = useMemo(() => PixelRatio.roundToNearestPixel(96), []);
  const pageWidth = useMemo(() => PixelRatio.roundToNearestPixel(dimensions.width), [dimensions.width]);

  const handleTimelineScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / pageWidth);
    const nextSelectedDate = weeks[index].dates[selectedDayOfWeek];
    setSelectedDate(nextSelectedDate);
  }, [weeks, selectedDayOfWeek, pageWidth])

  const timelineWeeks = weeks.map((week) => {
    return {
      week,
      elements: week.dates.map((date) => {
        const daysBetween = SimpleDate.daysBetween(date, selectedDate);
        const isNearSelection = Math.abs(daysBetween) <= 14;
        const isSelected = isNearSelection && date.getDayOfWeek() === selectedDayOfWeek;
        const isToday = date.equals(today);
        
        return useMemo(() => { 
          return (
            <TouchableRipple
              key={date.toString()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => handleDateSelection(date)}
              style={[
                styles.timelineDateContainer,
                isToday && styles.timelineDateContainerToday,
                isSelected && styles.timelineDateContainerSelected,
              ]}
            >
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleDateSelection(date)}
              >
                <View
                  style={[
                    styles.timelineDateContent,
                    isToday && styles.timelineDateContentToday,
                    isSelected && styles.timelineDateContentSelected,
                  ]}
                >
                  {/* <Text
                    style={[
                      styles.timelineDateDayOfWeek,
                      isToday && styles.timelineDateDayOfWeekToday,
                      isSelected && styles.timelineDateDayOfWeekSelected,
                    ]}
                    variant='labelLarge'
                  >
                    {date.getDayOfWeekLabel()}
                  </Text> */}
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
              </Pressable>
            </TouchableRipple>
          );
        }, [date, isToday, isSelected, styles]);
      })
    }
  });

  const timeline = useMemo(() => {
    return (
      <View style={{ position: 'relative', width: pageWidth, height: timelineHeight, marginBottom: -24 }}>
        <View style={[styles.timelineContent, { height: 60, width: pageWidth, paddingBottom: 8, marginBottom: -60 }]}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => {
            const isSelected = index === selectedDayOfWeek;
            return (
              <View key={day} style={[styles.timelineDateContainer, { alignItems: 'center' }]}>
                <Text
                  style={[
                    styles.timelineDateDayOfWeek,
                    isSelected && styles.timelineDateDayOfWeekSelected,
                  ]}
                  variant='labelLarge'
                >
                  {day}
                </Text>
              </View>
            )
          })}
        </View>
        <FlatList
          style={{ height: timelineHeight, width: pageWidth, flexShrink: 0, flexGrow: 0 }}
          ref={timelineFlatListRef}
          data={timelineWeeks}
          keyExtractor={({ week }) => week.dates[0].toString()}
          pagingEnabled
          initialScrollIndex={52}
          horizontal
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={32}
          onScroll={handleTimelineScroll}
          getItemLayout={(_, index) => ({
            length: pageWidth,
            offset: pageWidth * index,
            index,
          })}
          renderItem={({ item }) => {
            return (
              <View style={[styles.timelineContent, { height: timelineHeight, width: pageWidth, paddingTop: 8, paddingBottom: 24 }]}>
                {item.elements}
              </View>
            )
          }}
        />
      </View>
    );
  }, [weeks, pageWidth, timelineHeight, styles, selectedDate]);

  const renderTimelineHeader = () => {
    return (
      <View style={styles.timelineHeader}>
        <IconButton
          style={styles.timelineHeaderButton}
          icon={Icons.left}
          onPress={() => {
            triggerHaptic('selection');
            handleDateSelection(selectedDate.getDaysAgo(7), false);
          }}
          onLongPress={() => handleLongPressPrevious(selectedDate)}
          onPressOut={() => {
            if (longPressPreviousTimeout.current === null) return;
            clearTimeout(longPressPreviousTimeout.current);
            longPressPreviousTimeout.current = null;
          }}
          delayLongPress={400}
          size={20}
        />
        <IconButton
          style={styles.timelineHeaderButton}
          icon={Icons.right}
          onPress={() => {
            triggerHaptic('selection');
            handleDateSelection(selectedDate.getDaysAgo(-7), false);
          }}
          onLongPress={() => handleLongPressNext(selectedDate)}
          onPressOut={() => {
            if (longPressNextTimeout.current === null) return;
            clearTimeout(longPressNextTimeout.current);
            longPressNextTimeout.current = null;
          }}
          delayLongPress={400}
          size={20}
        />
      </View>
    )
  }

  const [measurementCounts, measurementCompletions] = useMemo(() => {
    const counts: number[] = [];
    const completions: number[] = [];
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
      
      completions[index] = noMeasurements || isFuture ? 0 : nonNullRecordingCount;
      counts[index] = filteredMeasurements.length;
    });
    return [counts, completions];
  }, [measurements, selectedWeekDates, displayedMeasurements, selectedWeekMeasurementValues, mergedRecordingsMap, today]);

  const [contentSwitchValue, setContentSwitchValue] = useState(0);
  const showMeasurements = contentSwitchValue === 0;
  const showHabits = !showMeasurements;

  const isReordering = (showMeasurements && isReorderingMeasurements) || (showHabits && isReorderingHabits);
  const isArchiving = (showMeasurements && showArchivedMeasurements) || (showHabits && showArchivedHabits);
  const contentSwitch = useMemo(() => {
    const isDisabled = isReordering || isArchiving;

    let switchColor = theme.dark ? theme.colors.elevation.level1 : theme.colors.surface;
    if (isDisabled) switchColor = theme.colors.surfaceDisabled;
    else if (baseColor) switchColor = globalPalette.backdrop;
  
    return (
      <View style={{
        marginHorizontal: -4,
        borderRadius: 0,
        backgroundColor: theme.dark ? theme.colors.surface : theme.colors.elevation.level3,
        overflow: 'hidden',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 8,
        alignSelf: 'stretch'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
          <AnimatedView
            style={{
              position: 'absolute',
              height: '100%',
              width: '50%',
              backgroundColor: switchColor,
              borderRadius: 4,
              opacity: isDisabled ? 0.5 : 1,
            }}
            startLeft={0}
            endLeft={50}
            isSpring
            isEnd={showHabits}
          />
          <Pressable
            style={[
              { width: '50%', height: 40, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
            ]}
            onPressIn={() => setContentSwitchValue(0)}
            disabled={isDisabled}
          >
            <View>
              <Icon source={Icons.measurement} size={14} color={showMeasurements ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
            </View>
            <Text variant='labelLarge' style={[
              { color: showMeasurements ? theme.colors.onSurface : theme.colors.onSurfaceDisabled }
            ]}>
              MEASUREMENTS
            </Text>
          </Pressable>
          <Pressable
            style={[
              { width: '50%', height: 40, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
            ]}
            onPressIn={() => setContentSwitchValue(1)}
            disabled={isDisabled}
          >
            <View>
              <Icon source={Icons.habit} size={14} color={showHabits ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
            </View>
            <Text variant='labelLarge' style={[
              { color: showHabits ? theme.colors.onSurface : theme.colors.onSurfaceDisabled }
            ]}>
              HABITS
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }, [isReordering, isArchiving, baseColor, showMeasurements, showHabits, styles]);

  const [showTimelineStatuses, setShowTimelineStatuses] = useState(true);
  const timelineStatuses = useMemo(() => {
    return displayedMeasurements.length > 0 && (
      <View style={[{ borderRadius: 4, flexShrink: 1, marginHorizontal: 16 }]}>
        <View style={[styles.timelineContent, { width: pageWidth, marginLeft: -16 }]}>
          {selectedWeekDates.map((date, index) => {
            const isToday = date.toString() === today.toString();
            const isSelected = index === selectedDayOfWeek;
            const isFuture = date.after(today);            
            const measurementCount = measurementCounts[index];
            const measurementCompletion = measurementCompletions[index];
            
            const color = isSelected ? theme.colors.onSurface : basePalette.disabled;
            const daily = selectedWeekDailyHabitPointTotals[index] || 0;
            const weekly = selectedWeekWeeklyHabitPointTotals[index] || 0;
            const total = daily + weekly;
            return (
              <Pressable
                key={'h' + date.toString()}
                style={[
                  styles.dailyPointsContainer,
                  isToday && styles.dailyPointsContainerToday,
                  isSelected && styles.dailyPointsContainerSelected,
                ]}
                onPress={() => handleDateSelection(date)}
              >
                {(isFuture || measurementCount === 0) && (
                  <Icon
                    source={Icons.indeterminate}
                    size={14}
                    color={color}
                  />
                )}
                {!isFuture && measurementCount > 0 && (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 20 }}>
                      <CircularProgress
                        size={20}
                        strokeWidth={2}
                        progress={measurementCompletion / measurementCount}
                        color={color}
                        trackColor={theme.colors.surfaceDisabled}
                        icon={Icons.measurement}
                        iconColor={measurementCompletion === measurementCount ? color : theme.colors.surfaceDisabled}
                      />
                    </View>
                    {displayedHabits.length > 0 && <Points
                      style={styles.dailyPointTotal}
                      points={total}
                      size='medium'
                      inline
                      decimals={hasNonStandardRewardHabit ? 1 : 0}
                      hideIcon={hasNonStandardRewardHabit}
                      color={color}
                    />}
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    )
  }, [
    displayedMeasurements.length,
    displayedHabits.length,
    selectedWeekDates,
    selectedWeekDailyHabitPointTotals,
    selectedWeekWeeklyHabitPointTotals,
    measurementCounts,
    measurementCompletions,
    selectedWeekPointTotal,
    perWeekPointTarget,
    daysThisWeek,
    styles,
    theme,
    basePalette,
  ]);

  const habitProgressBar = useMemo(() => {
    return displayedHabits.length > 0 && (
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 8, marginBottom: 32, gap: 12, alignItems: 'center' }}>
        <ArchedProgressBar
          width={dimensions.width - 40}
          strokeWidth={6}
          backgroundColor={theme.colors.elevation.level3}
          progress={selectedWeekPointTotal / perWeekPointTarget}
          progressColor={globalPalette.primary}
          progressTarget={daysThisWeek < 7 ? daysThisWeek / 7 : 0}
          progressTargetColor={theme.colors.surfaceDisabled}
          tickCount={0}
          tickLength={2}
          tickWidth={3}
          tickColor={theme.colors.onSurfaceDisabled}
        />
        <Pressable
          style={{ position: 'absolute', width: '100%', top: 16, paddingLeft: 20, overflow: 'visible' }}
          onPress={() => {
            setShowTimelineStatuses(prev => !prev);
          }}
        >
          <View style={{ alignSelf: 'center' }}>
            <View style={styles.weekPointsContainer}>
              <Points
                inline
                size={'x-large'}
                style={{ width: 48 }}
                points={selectedWeekPointTotal}
                textColor={theme.colors.onSurface}
                iconColor={theme.colors.onSurface}
                decimals={hasNonStandardRewardHabit ? 1 : 0}
              />
              <Text variant='bodyMedium' style={styles.weekPointsDivider}>/</Text>
              <Text variant='bodyLarge' style={{ textAlign: 'right' }}>{perWeekPointTarget}</Text>
              <Icon source={showTimelineStatuses ? Icons.up : Icons.down} size={16} color={theme.colors.onSurface} />
            </View>
          </View>
        </Pressable>
      </View>
    );
  }, [displayedHabits.length, dimensions.width, selectedWeekPointTotal, perWeekPointTarget, daysThisWeek, styles, showTimelineStatuses]);

  const renderSectionTitle = useCallback(() => {
    const buttonStyle: ViewStyle = {
      flexGrow: 1,
      flexShrink: 1,
      flexDirection: 'row',
      overflow: 'hidden',
      marginTop: 0,
      marginBottom: 0,
      gap: 8,
      height: 40,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: globalPalette.backdrop,
    };

    if (isReordering || isArchiving) {
      return (
        <View style={{ width: '100%', alignItems: 'flex-end', flexDirection: 'row' }}>
          <TouchableRipple
            onPress={() => {
              if (showMeasurements) {
                if (isArchiving) {
                  setShowArchivedMeasurements(false);
                } else if (isReordering) {
                  submitMeasurementOrder();
                  setIsReorderingMeasurements(false);
                }
              } else if (showHabits) {
                if (isArchiving) {
                  setShowArchivedHabits(false);
                } else if (isReordering) {
                  submitHabitOrder();
                  setIsReorderingHabits(false);
                }
              }
            }}
            style={buttonStyle}
          >
            <>
              <Icon source={Icons.complete} size={16} color={theme.colors.onSurface} />
              <Text variant='labelLarge' style={{ textTransform: 'uppercase' }}>Done</Text>
            </>
          </TouchableRipple>
        </View>
      );
    }

    const todayIndicatorStyles: ViewStyle = {
      width: 6,
      height: 6,
      borderRadius: 100,
      backgroundColor: theme.colors.primary,
      marginLeft: -14,
      flexShrink: 0,
    };
    return (
      <View style={{ flexDirection: 'row', flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingLeft: isToday ? 0 : 48 + 4 }}>
        {isToday && <View style={todayIndicatorStyles} />}
        <Text variant='titleLarge' style={{ }}>{selectedDate.toFormattedString(true, false, true)}</Text>
      </View>
    );
  }, [showMeasurements, showHabits, isReordering, isArchiving, isToday, selectedDate, styles, submitMeasurementOrder, submitHabitOrder]);

  const contentHeader = useMemo(() => {
    return (
      <View style={styles.sectionHeader}>
        {!isReordering && !isArchiving && <BottomDrawer
          title='Create'
          anchor={
            <IconButton
              style={styles.sectionHeaderButton}
              icon={Icons.add}
              size={20}
            />
          }
          items={addMenuItems}
          onSelect={(item) => {
            setTimeout(() => {
              router.push(item.value === 'measurement' ? '/measurement/create' : '/habit/create');
            }, 0);
          }}
        />}
        {renderSectionTitle()}
        {!isToday && (
          <View>
            <IconButton
              style={styles.sectionHeaderButton}
              onPress={() => {
                timelineFlatListRef.current?.scrollToOffset({ offset: 52 * pageWidth, animated: Platform.OS !== 'web' });
                setSelectedDate(today);
              }}
              icon={Icons.today}
              size={20}
            />
          </View>
        )}
        {!isReordering && !isArchiving && <BottomDrawer
          title={showMeasurements ? 'Measurements' : 'Habits'}
          anchor={
            <IconButton
              style={styles.sectionHeaderButton}
              icon={Icons.settings}
              size={20}
            />
          }
          items={showMeasurements ? measurementMenuItems : habitMenuItems}
          onSelect={({ value }) => {
            setTimeout(() => {
              if (showMeasurements) {
                switch (value) {
                  case 'create':
                    router.push('/measurement/create');
                    break;
                  case 'reorder':
                    if (isReorderingMeasurements) submitMeasurementOrder()
                    else setMeasurementPriorityOverrides(orderedMeasurements.map(({ id }) => id));
                    setIsReorderingMeasurements(!isReorderingMeasurements);
                    setShowArchivedHabits(false);
                    break;
                  case 'expand':
                    setExpandedMeasurements(new Set(displayedMeasurementIds));
                    break;
                  case 'collapse':
                    setExpandedMeasurements(new Set());
                    break;
                  case 'visibility':
                    setShowArchivedMeasurements(!showArchivedMeasurements);
                    setIsReorderingMeasurements(false);
                    break;
                  case 'reset':
                    clearRecordings();
                    break;
                  default:
                    break;
                }
              } else {
                switch (value) {
                  case 'create':
                    router.push('/habit/create');
                    break;
                  case 'reorder':
                    if (isReorderingHabits) submitHabitOrder();
                    else setHabitPriorityOverrides(orderedHabits.map(({ id }) => id));
                    setIsReorderingHabits(!isReorderingHabits);
                    setShowArchivedHabits(false);
                    break;
                  case 'expand':
                    setExpandedHabits(new Set(displayedHabitIds));
                    break;
                  case 'collapse':
                    setExpandedHabits(new Set());
                    break;
                  case 'visibility':
                    setShowArchivedHabits(!showArchivedHabits);
                    setIsReorderingHabits(false);
                    break;
                  case 'reset':
                    clearRecordings();
                    break;
                  default:
                    break;
                }
              }
            }, 150);
          }}
        />}
      </View>
    )
  }, [isReordering, isArchiving, showMeasurements, showHabits, addMenuItems, styles, renderSectionTitle]);


  const measurementTab = (
    <Fragment key='measurements'>
      {displayedMeasurements.length ? (
        <View style={styles.recordingView}>
          {isReorderingMeasurements ? (
            <DraggableList
              items={measurementPriorityOverrides || []}
              onReorder={(nextItems) => {
                setMeasurementPriorityOverrides(nextItems);
              }}
              renderItem={(item, index, isDragging) => {
                const measurement = measurements.find(({ id }) => id === item);
                if (!measurement) return null;

                return (
                    <RecordingMeasurementItem
                      index={index}
                      measurement={measurement}
                      currentDate={selectedDate}
                      weekMeasurementValues={selectedWeekMeasurementValues.get(measurement.id) || []}
                      disabled={isDragging}
                      reordering
                    />
                );
              }}
            />
          ) : (
            <ScrollView>
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
                    updateRecording={updateRecording} 
                    updateNote={updateNote}
                    onPress={() => {
                      const nextExpandedMeasurements = new Set([...expandedMeasurements]);
                      nextExpandedMeasurements.has(id) ? nextExpandedMeasurements.delete(id) : nextExpandedMeasurements.add(id);
                      setExpandedMeasurements(nextExpandedMeasurements);
                    }}
                    onLongPress={(measurementId) => {
                      triggerHaptic('selection');
                      router.push(`/measurement/${measurementId}`);
                    }}
                    archiving={showArchivedMeasurements}
                    onArchive={toggleMeasurementArchived}
                  />
                );
              })}
              {measurements.length < 3 && <QuickStartButton />}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <View style={styles.noData}>
            <View style={styles.noDataIcon}>
              <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
            </View>
            <Text style={styles.noDataText} variant='bodyLarge'>No measurements</Text>
          </View>
          {!measurements.length && <QuickStartButton />}
        </>
      )}
    </Fragment>
  );

  const habitTab = (
    <Fragment key='habits'>
      {displayedHabits.length ? (
        <View style={styles.recordingView}>
          {isReorderingHabits ? (
            <DraggableList
              items={habitPriorityOverrides || []}
              onReorder={(nextItems) => {
                setHabitPriorityOverrides(nextItems);
              }}
              renderItem={(item, index, isDragging) => {
                const habit = habits.find(({ id }) => id === item);
                if (!habit) return null;

                return (
                  <RecordingDataHabit
                    index={index}
                    habit={habit}
                    currentDate={selectedDate}
                    weekDates={selectedWeekDates}
                    measurements={measurements}
                    recordingData={mergedRecordingsMap}
                    disabled={isDragging}
                    reordering
                  />
                );
              }}
            />
          ) : (
            <ScrollView>
              {displayedHabits.map((habit, index) => {
                const { id } = habit;
                return (
                  <RecordingDataHabit
                    key={habit.id}
                    index={index}
                    habit={habit}
                    currentDate={selectedDate}
                    weekDates={selectedWeekDates}
                    measurements={measurements}
                    expanded={expandedHabits.has(id)}
                    recordingData={mergedRecordingsMap}
                    onPress={() => {
                      const nextExpandedHabits = new Set([...expandedHabits]);
                      nextExpandedHabits.has(id) ? nextExpandedHabits.delete(id) : nextExpandedHabits.add(id);
                      setExpandedHabits(nextExpandedHabits);
                    }}
                    onLongPress={(habitId) => {
                      triggerHaptic('selection');
                      router.push(`/habit/${habitId}`);
                    }}
                    archiving={showArchivedHabits}
                    onArchive={toggleHabitArchived}
                  />
                );
              })}
              {habits.length < 3 && <QuickStartButton />}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <View style={styles.noData}>
            <View style={styles.noDataIcon}>
              <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
            </View>
            <Text style={styles.noDataText} variant='bodyLarge'>No habits</Text>
          </View>
          {!habits.length && <QuickStartButton />}
        </>
      )}
    </Fragment>
  );

  const renderScene = ({ route }: { route: { key: string } }) => {
    return route.key === 'measurements' ? measurementTab : habitTab;
  }

  const tabs = (
    <TabView
      renderTabBar={({ position, navigationState: { index } }) => {
        const isDisabled = isReordering || isArchiving;

        let switchColor = theme.dark ? theme.colors.elevation.level1 : theme.colors.surface;
        if (isDisabled) switchColor = theme.colors.surfaceDisabled;
        else if (baseColor) switchColor = globalPalette.backdrop;
      
        const measurementCount = measurementCounts[selectedDayOfWeek];
        const measurementCompletion = measurementCompletions[selectedDayOfWeek];
        
        const measurementColor = contentSwitchValue === 0 ? theme.colors.onSurface : theme.colors.onSurfaceDisabled;
        const habitColor = contentSwitchValue === 1 ? theme.colors.onSurface : theme.colors.onSurfaceDisabled;
        const daily = selectedWeekDailyHabitPointTotals[selectedDayOfWeek] || 0;
        const weekly = selectedWeekWeeklyHabitPointTotals[selectedDayOfWeek] || 0;
        const total = daily + weekly;
      
        return (
          <View style={{
            backgroundColor: theme.dark ? theme.colors.surface : theme.colors.elevation.level3,
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: 8,
            alignSelf: 'stretch',
            position: 'relative',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center'}}>
              <Animated.View
                style={[{
                  position: 'absolute',
                  height: '100%',
                  width: '50%',
                  backgroundColor: switchColor,
                  borderRadius: 4,
                  opacity: isDisabled ? 0.5 : 1,
                  transform: [{
                    translateX: position.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (pageWidth / 2) - 8]
                    })
                  }]
                }]}
              />
              <Pressable
                style={[
                  { width: '50%', height: 40, gap: 6, paddingLeft: 20, paddingRight: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                ]}
                onPressIn={() => setContentSwitchValue(0)}
                disabled={isDisabled}
              >
                {/* <View>
                  <Icon source={Icons.measurement} size={14} color={showMeasurements ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
                </View> */}
                <Text variant='labelLarge' style={[
                  { color: showMeasurements ? theme.colors.onSurface : theme.colors.onSurfaceDisabled }
                ]}>
                  MEASUREMENTS
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 20 }}>
                  <CircularProgress
                    size={18}
                    strokeWidth={2}
                    progress={measurementCompletion / measurementCount}
                    color={measurementColor}
                    trackColor={theme.colors.surfaceDisabled}
                    icon={Icons.measurement}
                    iconColor={measurementCompletion === measurementCount ? measurementColor : theme.colors.surfaceDisabled}
                  />
                </View>
              </Pressable>
              <Pressable
                style={[
                  { width: '50%', height: 40, gap: 6, paddingLeft: 20, paddingRight: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                ]}
                onPressIn={() => setContentSwitchValue(1)}
                disabled={isDisabled}
              >
                {/* <View>
                  <Icon source={Icons.habit} size={14} color={showHabits ? theme.colors.onSurface : theme.colors.onSurfaceDisabled} />
                </View> */}
                <Text variant='labelLarge' style={[
                  { color: showHabits ? theme.colors.onSurface : theme.colors.onSurfaceDisabled }
                ]}>
                  HABITS
                </Text>

                <Points
                  style={styles.dailyPointTotal}
                  points={total}
                  size='medium'
                  inline
                  decimals={hasNonStandardRewardHabit ? 1 : 0}
                  // hideIcon={hasNonStandardRewardHabit}
                  color={habitColor}
                />
              </Pressable>

          </View>
          </View>
        )
      }}
      navigationState={{ index: contentSwitchValue, routes: [
        { key: 'measurements', title: 'Measurements' },
        { key: 'habits', title: 'Habits' },
      ]}}
      onIndexChange={setContentSwitchValue}
      renderScene={renderScene}
      swipeEnabled={!isArchiving && !isReordering}
      initialLayout={{ width: pageWidth }}
    />
  )

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.surface} barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <View
        style={[styles.container, { marginTop: top }]}
      >
        <View style={{ backgroundColor: theme.colors.surface }}>
          {timeline}
          {habitProgressBar}
          {/* {renderTimelineHeader()} */}
          {showTimelineStatuses && timelineStatuses}
          {contentHeader}
        </View>
        {tabs}
      </View>
    </>
  );
}

const createStyles = (theme: MD3Theme, palette: Palette) => {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      flexShrink: 1,
      backgroundColor: theme.dark ? theme.colors.surface : theme.colors.elevation.level3,
    },
    timelineHeader: {
      alignSelf: 'stretch',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    timelineHeaderText: {
      flexGrow: 1,
      textAlign: 'center',
    },
    timelineHeaderButton: {
      width: 40,
      height: 40,
      margin: 0,
      borderRadius: 4,
      marginHorizontal: 4,
      marginBottom: -20,
      marginTop: -8
    },
    timelineContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    timelineDate: {

    },
    timelineDateToday: {},
    timelineDateSelected: {

    },
    timelineDateContainer: {
      flexBasis: 100,
      flexShrink: 1,
      // alignItems: 'center',
      overflow: 'hidden',
      flexGrow: 1,
      borderRadius: 12,

      justifyContent: 'center',
      alignSelf: 'stretch',
      alignItems: 'stretch',
      gap: 4,
    },
    timelineDateContainerToday: {},
    timelineDateContainerSelected: {
    },
    timelineDateContent: {
      paddingTop: 20,
      gap: 4,
    },
    timelineDateContentToday: {},
    timelineDateContentSelected: {},
    timelineDateDayOfWeek: {
      textAlign: 'center',
      color: theme.colors.onSurfaceDisabled,
      textTransform: 'uppercase',
    },
    timelineDateDayOfWeekToday: {},
    timelineDateDayOfWeekSelected: {
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: palette.primary,
      transform: [{ translateX: -2 }],
    },
    todayIndicatorToday: {
    },
    weekPointsContainer: {
      flexGrow: 0,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    weekPointsDivider: {},
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      gap: 4,
      marginBottom: 4,
      minHeight: 48,
    },
    sectionHeaderButton: {
      width: 48,
      height: 48,
      borderRadius: 4,
      margin: 0,
    },
    recordingView: {
      flexGrow: 1,
      flexShrink: 1,
    },
    dailyPointsContainer: {
      flexBasis: 100,
      flexShrink: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      gap: 4,
      height: 60,
    },
    dailyPointsContainerToday: {},
    dailyPointsContainerSelected: {
    },
    dailyPointTotal: {
      justifyContent: 'center',
    },
    noData: {
      flexDirection: 'row',
      marginTop: 20,
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
      marginBottom: 20,
      borderRadius: 4,
      width: 300,
    },
    noDataButtonContent: {
      // paddingHorizontal: 12,
      paddingVertical: 4,
    },
    noDataButtonText: {
    },
    sampleDataButton: {
      width: 300,
      borderRadius: 4,
      alignSelf: 'center',
      marginTop: 32,
      marginBottom: 12,
    },
    sampleDataButtonContent: {
      paddingVertical: 4,
    },
    sampleDataButtonText: {
      color: theme.colors.surface,
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
  onPress?: (id: string) => void,
  onLongPress?: (id: string) => void,
  onPressIn?: (id: string) => void,
  onPressOut?: (id: string) => void,
  disabled?: boolean,
  reordering?: boolean,
  archiving?: boolean,
  onArchive?: (measurement: Measurement, archived: boolean) => void,
  updateRecording?: (value: number | null, measurement: Measurement, date: string) => void,
  updateNote?: (content: string, measurement: Measurement, date: string) => void,
}

const RecordingMeasurementItem = (props : RecordingMeasurementItemProps) : JSX.Element | null  => {
  const {
    index,
    measurement,
    currentDate,
    weekMeasurementValues,
    mergedRecordingValues,
    expanded,
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    reordering,
    archiving,
    onArchive,
    updateRecording,
    updateNote,
  } = props;
  const theme = useTheme();
  const typeData = getMeasurementTypeData(measurement.type);
  const measurements = useMeasurements();
  if (!typeData) return null;
  
  const isDuration = measurement.type === 'duration';
  const isBool = measurement.type === 'bool';
  const isTime = measurement.type === 'time';
  const isCombo = measurement.type === 'combo';
  const unitString = isDuration ? 'minutes' : isBool ? '--' : isTime ? 'hours' : measurement.unit;


  const startDate = getMeasurementStartDate(measurement.id, measurements, mergedRecordingValues);
  const today = useToday();
  
  const longPressLeftInterval = useRef<null | NodeJS.Timeout>(null);
  const longPressRightInterval = useRef<null | NodeJS.Timeout>(null);

  const value = weekMeasurementValues[currentDate.getDayOfWeek()];
  const valueRef = useRef(value);

  const [showValueDialog, setShowValueDialog] = useState(false);
  const [valueString, setValueString] = useState('');
  const [timeOffsetString, setTimeOffsetString] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [noteString, setNoteString] = useState('');

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleLongPressLeft = () => {
    if (!onValueChange) return;
    longPressLeftInterval.current = setInterval(() => {
      onValueChange(valueRef.current === null ? measurement.initial : valueRef.current - measurement.step);
    }, 100);
  }
  const handleLongPressRight = () => {
    if (!onValueChange) return;
    longPressRightInterval.current = setInterval(() => {
      onValueChange(valueRef.current === null ? measurement.initial : valueRef.current + measurement.step);
    }, 100);
  }

  const { getPalette, getCombinedPalette } = usePalettes();
  const measurementPalette = useMemo(() => getPalette(measurement.baseColor), [measurement.baseColor, getPalette]);
  const combinedPalette = useMemo(() => getCombinedPalette(measurement.baseColor), [measurement.baseColor, getCombinedPalette]);
  const styles = useMemo(() =>
    createMeasurementStyles(theme, measurementPalette, combinedPalette, index),
    [theme, measurementPalette, combinedPalette, index]
  );

  const handleShowValueDialog = useCallback(() => {
    const startingValue = value === null ? measurement.initial : value;
    if (isTime) {
      const valueWithoutOffset = (24 + (startingValue % 24)) % 24;
      setValueString(formatTimeValue(valueWithoutOffset));
      setTimeOffsetString(Math.floor(startingValue / 24).toFixed(0));
    } else if (isBool) {
      setValueString(startingValue ? 'Yes' : 'No');
    } else {
      setValueString(startingValue.toString());
    }
    setNoteString(measurement.notes?.find(({ date }) => date === currentDate.toString())?.content || '');
    setShowValueDialog(true);
  }, [measurement.initial, currentDate, value, setShowValueDialog, setValueString, setTimeOffsetString, setNoteString]);

  const onValueChange = useCallback((nextValue: number | null) => {
    triggerHaptic('impact', ImpactFeedbackStyle.Light);
    updateRecording?.(nextValue, measurement, currentDate.toString());
  }, [measurement, currentDate, updateRecording]);

  const onNoteChange = useCallback((nextNote: string) => {
    updateNote?.(nextNote, measurement, currentDate.toString());
  }, [measurement, currentDate, updateNote]);

  const renderControlContent = () => {

    const leftButton = useMemo(() =>
      isCombo ?
        <View style={styles.controlButton} /> :
      isBool ? (
        <IconButton
          hitSlop={10}
          style={styles.controlButton}
          size={16}
          icon={Icons.subtract}
          onPress={() => {
            onValueChange ? onValueChange(0) : null;
          }}
        />
      ) : (
        <IconButton
          hitSlop={10}
          style={styles.controlButton}
          size={18}
          icon={Icons.subtract}
          onPress={() => {
            onValueChange ? onValueChange(value === null ? measurement.initial - measurement.step : value - measurement.step) : null;
          }}
          onLongPress={() => {
            handleLongPressLeft();
          }}
          onPressOut={() => {
            if (longPressLeftInterval.current === null) return;
            clearInterval(longPressLeftInterval.current);
            longPressLeftInterval.current = null;
          }}
          delayLongPress={300}
        />
      ),
    [isCombo, isBool, onValueChange, value, measurement.initial, measurement.step, styles]);

    const rightButton = useMemo(() =>
      isCombo ?
        <View style={styles.controlButton} /> :
      isBool ? (
        <IconButton
          hitSlop={10}
          style={styles.controlButton}
          size={16}
          icon={Icons.add}
          onPress={() => {
            onValueChange ? onValueChange(1) : null;
          }}
        />
      ) : (
        <IconButton
          hitSlop={10}
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
          delayLongPress={300}
        />
      ),
    [isCombo, isBool, onValueChange, value, measurement.initial, measurement.step, styles]);

    const valueButton = useMemo(() =>
      value !== null ? (
        <TouchableRipple
          style={styles.value}
          onLongPress={() => {
            triggerHaptic('selection');
            handleShowValueDialog();
          }}
          disabled={isCombo}
        >
          {isBool ? (
            <Icon source={value ? Icons.complete : Icons.incomplete} color={combinedPalette.primary} size={14} />
          ) : (
            <Text style={{ color: combinedPalette.primary }} numberOfLines={1} ellipsizeMode='tail' variant='bodyLarge'>
              {formatValue(value, measurement.type, measurement.unit, true)}
            </Text>
          )}
        </TouchableRipple>
      ) : (
        <TouchableRipple
          style={[styles.value, styles.defaultValue]}
          onPress={() => onValueChange ? onValueChange(measurement.initial) : null}
          disabled={isCombo}
          onLongPress={isCombo ? undefined : () => {
            triggerHaptic('selection');
            handleShowValueDialog();
          }}
        >
          {isBool ? (
            <Icon source={measurement.initial ? Icons.complete : Icons.incomplete} color={theme.colors.onSurfaceDisabled} size={14} />
          ) : (
            <Text style={{ color: theme.colors.onSurfaceDisabled }} numberOfLines={1} ellipsizeMode='tail' variant='bodyLarge'>
              {formatValue(measurement.initial, measurement.type, measurement.unit, true)}
            </Text>
          )}
        </TouchableRipple>
      ),
    [
      value,
      isTime,
      isCombo,
      isBool,
      onValueChange,
      measurement,
      combinedPalette,
      theme,
      styles,
      setShowValueDialog,
      setValueString,
      setTimeOffsetString,
      formatValue,
      formatTimeValue
    ]);

    const controlContent = useMemo(() => {
      if (reordering) return <Icon source={Icons.drag} size={24} />
      if (archiving) return (
        <Icon
          source={measurement.archived ? Icons.hide : Icons.show}
          size={24}
          color={measurement.archived ? theme.colors.onSurfaceDisabled : undefined}
        />
      );

      return (
        <View style={styles.controls}>
          {leftButton}
          {valueButton}
          {rightButton}
        </View>
      );
    }, [reordering, archiving, measurement, theme, styles, leftButton, valueButton, rightButton]);

    return controlContent;
  }

  const renderExpandedContent = () => {
    if (!expanded || reordering || archiving) return null;

    const total = weekMeasurementValues.reduce((acc: number, curr) => acc + (curr || 0), 0);
    const totalString = formatValue(total, isBool ? 'count' : measurement.type, measurement.unit, true);
    const count = weekMeasurementValues.reduce((acc: number, curr) => acc + (curr === null ? 0 : 1), 0);
    const average = count === 0 ? null : total / count;
    const averageString = formatValue(average, isBool ? 'count' : measurement.type, measurement.unit, true);

    const actionContent = (
      <View style={styles.actionContent}>
        {!isCombo && (
          <TouchableRipple
            style={styles.actionButton}
            hitSlop={6}
            onPress={handleShowValueDialog}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon source={Icons.menu} size={14} />
              <Text variant="labelLarge">MORE</Text>
            </View>
          </TouchableRipple>
        )}
        <TouchableRipple
          style={styles.actionButton}
          hitSlop={6}
          onPress={() => {
            router.push(`/measurement/${measurement.id}`);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon source={Icons.edit} size={14} />
            <Text variant="labelLarge">EDIT</Text>
          </View>
        </TouchableRipple>
      </View>
    );

    const aggregateContent = (
      <View style={styles.aggregateContent}>
        {isTime ? null : (<View style={styles.aggregateMetric}>
          <Text variant='bodyMedium' ellipsizeMode='tail' style={styles.aggregateMetricLabel}>
            This week:
          </Text>
          <Text variant='bodyMedium' style={styles.aggregateMetricValue}>
            {count ? totalString : '--'}
          </Text>
        </View>)}
      </View>
    );

    return expanded && (
      <View style={styles.expandedContent}>
        {aggregateContent}
        {actionContent}
      </View>
    );
  }

  const completionStatuses = weekMeasurementValues.map((value, index) => {
    const date = currentDate.getDaysAgo(currentDate.getDayOfWeek() - index);
    const isFuture = date.after(today);
    const isSelected = index === currentDate.getDayOfWeek();
    const hasNotStarted = !startDate || startDate > date.toString();

    const hasNote = !!measurement.notes?.find((n) => n.date === date.toString());
    const hasValue = value !== null;
    let icon = Icons.subtract;
    if (hasNote) {
      icon = Icons.note;
    } else if (hasValue) {
      icon = Icons.recorded;
    }

    return useMemo(() => (
      <View
        key={date.toString()}
        style={[
          styles.completionStatus,
          !isSelected && { opacity: 0.8 },
        ]}
      >
        {
          isFuture || hasNotStarted ? (
            <Icon source={Icons.subtract} size={isSelected ? 16 : 12} color={theme.colors.onSurfaceDisabled} />
          ) : (
          <Icon
            source={icon}
            size={isSelected ? 16 : 12}
            color={combinedPalette.primary}
          />
        )}
      </View>
    ), [date.toString(), isFuture, hasNotStarted, isSelected, combinedPalette.primary, styles, icon]);
  });

  const content = (
    <>
      <View style={[styles.content]}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View style={styles.label}>
            <MeasurementLabel
              measurement={measurement}
              size='large'
            />
          </View>
          <View style={styles.completionStatuses}>
            {completionStatuses}
          </View>
        </View>
        {renderControlContent()}
      </View>
    </>
  );

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours() + selectedDate.getMinutes() / 60;
      setValueString(formatTimeValue(hours));
    }
  };

  const onValueDialogSumbit = () => {
    if (!valueString) {
      onValueChange && onValueChange(null);
    } else if (isTime) {
      const parsedTime = parseTimeString(valueString) || { hours: 12, offset: 0 };
      const offset = parseInt(timeOffsetString) || 0;
      const nextValue = computeTimeValue(parsedTime.hours, offset);
      onValueChange && onValueChange(nextValue);
    } else {
      const nextValue = parseFloat(valueString) || 0;
      onValueChange && onValueChange(nextValue);
    }

    onNoteChange && onNoteChange(noteString);
    setShowValueDialog(false);

  }
  const valueDialog = (
    <>
      {(!showTimePicker || Platform.OS === 'ios') && <Portal>
        <Modal
          visible={showValueDialog}
          onDismiss={() => setShowValueDialog(false)}
          style={styles.dialogModal}
          contentContainerStyle={styles.dialogContainer}
        >
          <View style={styles.dialog}>
            <View style={styles.dialogContent}>
              <View style={styles.dialogTitle}>
                <MeasurementLabel
                  measurement={measurement}
                  size='large'
                />

                <IconButton
                  icon={Icons.close}
                  size={18}
                  style={styles.closeButton}
                  iconColor={theme.colors.onSurfaceDisabled}
                  onPress={() => setShowValueDialog(false)}
                />
              </View>
              {isTime ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[styles.dialogInput, { flexGrow: 1, flexShrink: 1 }]}
                      mode='outlined'
                      label='Time'
                      value={valueString}
                      placeholder="12:00pm"
                      onFocus={() => {
                        if (Platform.OS !== 'web') {
                          Keyboard.dismiss();
                          setShowTimePicker(true);
                        }
                      }}
                      onChangeText={(text) => {
                        if (Platform.OS !== 'web') return;
                        setValueString(text);
                      }}
                      onBlur={() => {
                        if (Platform.OS !== 'web') return;

                        const parsedTime = parseTimeString(valueString) || { hours: 12, offset: 0 };
                        setValueString(formatTimeValue(parsedTime.hours));
                      }}
                      activeOutlineColor={combinedPalette.primary || undefined}
                      showSoftInputOnFocus={Platform.OS === 'web'}
                    />
                    <TextInput
                      style={[styles.dialogInput, { width: 100, flexShrink: 0 }]}
                      mode='outlined'
                      label='Offset'
                      value={timeOffsetString}
                      activeOutlineColor={combinedPalette.primary || undefined}
                      keyboardType="numeric"
                      right={
                        <TextInput.Affix text={`days`} />
                      }
                      onChangeText={(text) => {
                        setTimeOffsetString(text);
                      }}
                      onBlur={() => {
                        const offset = parseInt(timeOffsetString) || 0;
                        setTimeOffsetString(offset.toString());
                      }}
                    />
                    <IconButton
                      icon={Icons.delete}
                      style={styles.dialogDeleteButton}
                      size={20}
                      onPress={() => {
                        setValueString('');
                        setTimeOffsetString('');
                      }}
                    />
                  </View>
                  {Platform.OS === 'ios' && (
                    <DateTimePicker
                      value={new Date(
                        2000, 0, 1,
                        Math.floor(parseTimeString(valueString)?.hours || 12),
                        Math.round((parseTimeString(valueString)?.hours || 12) % 1 * 60)
                      )}
                      mode="time"
                      onChange={handleTimeChange}
                      display="spinner"
                      minuteInterval={1}
                      textColor={combinedPalette.primary}
                      accentColor={combinedPalette.primary}
                    />
                  )}
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={styles.dialogInput}
                    mode='outlined'
                    label='Value'
                    value={valueString}
                    onChangeText={(text) => {
                      setValueString(text);
                    }}
                    disabled={isBool}
                    right={
                      isDuration && valueString ? <TextInput.Affix text={`(${formatValue(parseFloat(valueString), measurement.type)})`} /> :
                      unitString ? <TextInput.Affix text={unitString} /> :
                      null
                    }
                    activeOutlineColor={combinedPalette.primary || undefined}
                    keyboardType="numeric"
                  />
                  <IconButton
                    icon={Icons.delete}
                    style={styles.dialogDeleteButton}
                    size={20}
                    onPress={() => {
                      setValueString('');
                    }}
                  />
                </View>
              )}
              <TextInput
                style={styles.dialogInput}
                mode='outlined'
                label='Daily note'
                multiline={true}
                value={noteString}
                onChangeText={(text) => {
                  setNoteString(text.slice(0, 100));
                }}
                right={
                  <TextInput.Affix text={`${noteString.length} / 100`} />
                }
              />
            </View>
            <View style={styles.dialogButtons}>
              <Button
                mode="contained"
                style={styles.dialogButton}
                contentStyle={styles.dialogButtonContent}
                labelStyle={styles.dialogButtonLabel}
                onPress={onValueDialogSumbit}
                buttonColor={combinedPalette.backdrop}
              >
                <Text variant='labelLarge' style={[styles.dialogButtonText]}>
                  SUBMIT
                </Text>
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>}
      {showTimePicker && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={new Date(
            2000, 0, 1,
            Math.floor(parseTimeString(valueString)?.hours || 12),
            Math.round((parseTimeString(valueString)?.hours || 12) % 1 * 60)
          )}
          mode="time"
          onChange={handleTimeChange}
          display="spinner"
          minuteInterval={1}
          textColor={theme.colors.onSurface}
          accentColor={combinedPalette.primary}
        />
      )}
    </>
  );

  return reordering ? (
      <View style={[styles.container]}>
        {content}
      </View>
    ) : archiving ? (
      <TouchableRipple
        style={[styles.container, measurement.archived && { opacity: 0.5 }]}
        onPress={() => { onArchive && onArchive(measurement, !measurement.archived)}}
      >
        {content}
      </TouchableRipple>
    ) : (
      <>
        <TouchableRipple
          style={[styles.container]}
          onPress={onPress ? () => onPress(measurement.id) : undefined}
          onLongPress={onLongPress ? () => onLongPress(measurement.id) : undefined}
          onPressIn={onPressIn ? () => onPressIn(measurement.id) : undefined}
          onPressOut={onPressOut ? () => onPressOut(measurement.id) : undefined}
          delayLongPress={400}
        >
          {content}
        </TouchableRipple>
        {renderExpandedContent()}
        {valueDialog}
      </>
  );
}

const createMeasurementStyles = (theme: MD3Theme, measurementPalette: Palette, combinedPalette: Palette, index: number) => StyleSheet.create({
  wrapper: {
    
  },
  container: {
    marginHorizontal: 8,
    marginBottom: 8,
    marginTop: 0,
    borderRadius: 4,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 10,
    gap: 4,
    backgroundColor: theme.dark ? theme.colors.elevation.level1 : theme.colors.surface,
    overflow: 'hidden',
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
    marginBottom: 0,
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
    color: theme.colors.onSurfaceVariant,
  },
  value: {
    flexShrink: 0,
    textAlign: 'right',
    alignItems: 'center',
    justifyContent: 'center',


    height: 42,
    width: 104,

    paddingHorizontal: 12,
    borderRadius: 4,
  },
  defaultValue: {
    backgroundColor: 'transparent',
  },
  valueText: {
    color: theme.colors.onSurface,
  },
  defaultValueText: {
    color: theme.colors.onSurfaceDisabled,
  },
  controls: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: -8,
  },
  controlButton: {
    margin: 0,
    marginVertical: 0,
    width: 42,
    height: 42,
    borderRadius: 4,
  },
  expandedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.dark ? theme.colors.surface : theme.colors.elevation.level3,

    marginTop: -4,
    marginBottom: 12,
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 0,
  },
  completionStatuses: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
    marginTop: 4,
    marginBottom: -4
  },
  completionStatus: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: 20,
    borderRadius: 100,
  },
  aggregateContent: {
    flexShrink: 1,
    flexDirection: 'row',
    // justifyContent: 'flex-end',
    gap: 16,
    paddingRight: 8,
  },
  aggregateMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  aggregateMetricLabel: {
    flexShrink: 1,
    color: theme.colors.onSurfaceVariant,
  },
  aggregateMetricValue: {

  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 4,
    height: 32,
    paddingHorizontal: 16,
    margin: 0,
    justifyContent: 'center',
  },
  dialogModal: {
  },
  dialogContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 420,
    marginHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    boxShadow: `0px 0px 16px ${theme.colors.shadow}40`,
    
    overflow: 'hidden',
    
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  dialogTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 12,
  },
  closeButton: {
    margin: 0,
    height: 40,
    width: 40,
    borderRadius: 4,
  },
  dialogName: {
  },
  dialogVariant: {
    color: theme.colors.onSurfaceVariant,
  },
  dialogInput: {
    flexGrow: 1,
    flexShrink: 1,
  },
  dialogDeleteButton: {
    margin: 0,
    marginTop: 6,
    height: 50,
    width: 50,
    borderRadius: 4,
  },
  dialogButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  dialogButton: {
    flexGrow: 1,
    flexShrink: 1,
    width: '100%',
    borderRadius: 4,
  },
  dialogButtonContent: {
    height: 40,
    margin: 0,
  },
  dialogButtonLabel: {
    borderRadius: 0,
  },
  dialogButtonText: {
  },
  cancelButton: {
  },
  cancelButtonContent: {
  },
  cancelButtonText: {
    color: theme.colors.onSurface,
  },
});

type RecordingDataHabitProps = {
  habit: ComputedHabit,
  index: number,
  currentDate: SimpleDate,
  weekDates: SimpleDate[],
  measurements: Measurement[],
  expanded?: boolean,
  recordingData:  Map<string, Map<string, number | null>>,
  onPress?: (id: string) => void,
  onPressIn?: (id: string) => void,
  onLongPress?: (id: string) => void,
  disabled?: boolean,
  reordering?: boolean,
  archiving?: boolean,
  onArchive?: (habit: ComputedHabit, archived: boolean) => void,
}

const RecordingDataHabit = (props : RecordingDataHabitProps) : JSX.Element | null => {
  const {
    habit,
    index,
    currentDate,
    weekDates,
    measurements,
    expanded,
    recordingData,
    onPress,
    onPressIn,
    onLongPress,
    reordering,
    archiving,
    onArchive,
  } = props;

  const theme = useTheme();
  const { getCombinedPalette } = usePalettes();
  const combinedPalette = useMemo(() => getCombinedPalette(habit.baseColor), [habit.baseColor]);
  const styles = useMemo(() => createHabitStyles(theme, combinedPalette, index), [theme, combinedPalette, index]);

  const today = useToday();
  const isFuture = currentDate.after(today);

  const firstWeeklyCompletionIndex = useMemo(() => habit.isWeekly ? range(0, 7).map((_, index) => {
    const [complete] = getHabitCompletion(habit, measurements, weekDates.slice(0, index + 1), recordingData);
    return complete;
  }).findIndex((completion) => completion) : -1, [habit, measurements, weekDates, recordingData]);

  const completionContent = useMemo(() => {
    const completionCounts: number[] = [];
    const completionCount = weekDates.reduce((count, weekDate, index) => {
      const dates = habit.isWeekly ? weekDates : [weekDate];
      const complete = habit.isWeekly ? index === firstWeeklyCompletionIndex : getHabitCompletion(habit, measurements, dates, recordingData)[0];
      completionCounts.push(complete ? count + 1 : 0);
      return count + (complete ? 1 : 0);
    }, 0);

    const targetCount = habit.isWeekly ? 1 : habit.daysPerWeek;

    return (
      <View style={styles.completionContent}>
        {completionCounts.map((count, index) => {
          if (count === 0) return null;

          const isSelected = index === currentDate.getDayOfWeek();
          const isExtra = count > targetCount;
          let source = isExtra ? Icons.extra : Icons.habitComplete;
          let color = combinedPalette.primary;
        
          return (
            <View
              key={index}
              style={[
                styles.completionIcon,
                !isSelected && { opacity: 0.8 },
              ]}
            >
              <Icon source={source} size={isSelected ? 16 : 12} color={color} />
            </View>
          );
        })}
        {range(completionCount, targetCount).map((index) => (
          <View
            key={index}
            style={[
              styles.completionIcon,
              { opacity: 0.8 },
            ]}
          >
            <Icon source={Icons.subtract} size={12} color={combinedPalette.primary} />
          </View>
        ))}
      </View>
    )
  }, [habit, measurements, weekDates, recordingData, currentDate, firstWeeklyCompletionIndex, combinedPalette, styles]);

  const dates = useMemo(
    () => weekDates.slice(habit.isWeekly ? 0 : currentDate.getDayOfWeek(), currentDate.getDayOfWeek() + 1),
    [weekDates, currentDate, habit],
  );
  const [complete, points, conditionCompletions, conditionValues, conditionProgressions] = useMemo(
    () => getHabitCompletion(habit, measurements, dates, recordingData),
    [habit, measurements, dates, recordingData],
  );
  const [previousComplete, previousPoints] = useMemo(
    () => {
      if (!habit.isWeekly || dates.length === 1) return [false, 0];
      return getHabitCompletion(habit, measurements, dates.slice(0, -1), recordingData);
    },
    [habit, measurements, dates, recordingData],
  );

  const conditionCompletionContent = useMemo(() => {
    return (
      !isFuture && !reordering && !archiving && (
        <>
          {habit.conditions.length > 1 && (
            <View style={styles.predicate}>
              {/* <Icon source={getHabitPredicateIcon(habit.predicate)} size={14} color={complete ? combinedPalette.primary : combinedPalette.disabled} /> */}
              <Text style={[styles.predicateLabel, complete ? styles.predicateLabelComplete : {}]} variant='bodyLarge'>{getHabitPredicateLabel(habit.predicate)}</Text>
            </View>
          )}
          {!expanded && habit.conditions.map((condition, index) => {
            const conditionCompletion = conditionCompletions[index];
            const conditionProgress = conditionProgressions[index] || 0;
            const measurement = measurements.find(({ id }) => id === condition.measurementId);
            const palette = getCombinedPalette(measurement?.baseColor || habit.baseColor);
            return (
              <View key={condition.measurementId} style={[styles.dayCompletionIcon, conditionCompletion ? styles.dayCompletionIconComplete : {}]}>
                <CircularProgress
                  size={18}
                  strokeWidth={2}
                  color={conditionCompletion ? palette.primary : palette.disabled}
                  progress={conditionProgress}
                />
              </View>
            )
          })}
        </>
      )
    )
  }, [habit, measurements, conditionCompletions, conditionProgressions, theme, styles, isFuture, reordering, archiving, expanded]);

  const conditionContent = useMemo(() => {
    return (
      <View style={styles.conditionContent}>
        {habit.conditions.map(({ target, measurementId, operator }, index) => {
          const measurement = measurements.find(({ id }) => id === measurementId);
          if (!measurement) return null;

          const palette = getCombinedPalette(measurement.baseColor || habit.baseColor);

          const isBool = measurement.type === 'bool';

          const conditionCompletion = conditionCompletions[index];
          const conditionValue = conditionValues[index];
          const conditionProgress = conditionProgressions[index] || 0;

          const valueString = conditionValue === null ? '-' : formatValue(conditionValue, measurement.type, measurement.unit, false);
          const targetString = formatValue(target, measurement.type, measurement.unit, true);

          return (
            <View key={`${measurementId}${operator}${target}`} style={styles.condition}>
              <MeasurementLabel
                measurement={measurement}
                size='medium'
              />
              <View style={styles.conditionProgressLabel}>
                {isBool && conditionValue !== null ? (
                  <Icon
                    source={conditionValue ? Icons.complete : Icons.incomplete}
                    size={16}
                  />
                ) : (
                  <Text style={{ ...styles.conditionProgressCurrent, color: theme.colors.onSurface }} variant='bodyMedium'>
                    {valueString}
                  </Text>
                )}
                <Text style={{ ...styles.conditionProgressDivider, color: theme.colors.onSurfaceVariant }} variant='bodyMedium'>
                  {' / '}
                </Text>
                {isBool ? (
                  <Icon
                    source={operator === '==' ? Icons.complete : Icons.incomplete}
                    size={16}
                  />
                ) : (
                  <Text style={{ ...styles.conditionProgressTarget, color: theme.colors.onSurfaceVariant }} variant='bodyMedium' numberOfLines={1}>
                    {targetString}
                  </Text>
                )}
              </View>
              <CircularProgress
                size={18}
                strokeWidth={2}
                color={conditionCompletion ? palette.primary : palette.disabled}
                progress={conditionProgress}
              />
            </View>
          );
        })}
      </View>
    )
  }, [habit, measurements, conditionCompletions, conditionValues, conditionProgressions, theme, styles]);

  const renderExpandedContent = () => {
    const actionContent = (
      <View style={styles.actionContent}>
        <TouchableRipple
          style={styles.actionButton}
          hitSlop={6}
          onPress={() => {
            router.push(`/habit/${habit.id}`);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon source={Icons.edit} size={14} />
            <Text variant="labelLarge">EDIT</Text>
          </View>
        </TouchableRipple>
      </View>
    );

    return (
      <View style={styles.expandedContent}>
        {actionContent}
      </View>
    );
  }
  const expandedContent = useMemo(() => expanded && renderExpandedContent(), [styles, expanded]);

  const renderPointsContent = () => {
    const earnedPoints = points - previousPoints;
    const remainingPoints = habit.points - points;
    const partialPoints = (earnedPoints && earnedPoints !== habit.points) || (remainingPoints && remainingPoints !== habit.points);
    return (
      <View style={{
        marginLeft: 12,
        marginRight: -12,
        paddingVertical: 8,
        width: 64,
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderColor: theme.colors.surfaceDisabled,
        borderLeftWidth: 1,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 3 }}>
          {!!earnedPoints && (
            <Text
              variant='titleSmall'
              style={{ marginTop: -6, marginLeft: -10, color: earnedPoints ? combinedPalette.primary : theme.colors.onSurfaceDisabled }}
            >
              +
            </Text>
          )}
          <Points
            style={[styles.dayCompletionPoints]}
            size='large'
            points={earnedPoints || remainingPoints}
            decimals={partialPoints ? 1 : 0}
            color={earnedPoints ? combinedPalette.primary : theme.colors.onSurfaceDisabled}
            hideIcon={!!earnedPoints && !!partialPoints}
          />
        </View>
      </View>
    );
  }
  const pointsContent = useMemo(
    () => !reordering && !archiving && renderPointsContent(),
    [habit, complete, combinedPalette, theme, reordering, archiving, styles, points, previousPoints],
  );

  const content = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
      <View style={{ flexGrow: 1 }}>
        <View style={[styles.content]}>
          <View>
            <HabitLabel
              habit={habit}
              size='large'
            />
            {completionContent}
          </View>
          <View style={styles.dayCompletion}>
            {conditionCompletionContent}
            {reordering && <Icon source={Icons.drag} size={24} />}
            {archiving && <Icon source={habit.archived ? Icons.hide : Icons.show} size={24} color={habit.archived ? theme.colors.onSurfaceDisabled : undefined}/>}
          </View>
        </View>
        {expanded && conditionContent}
      </View>
      {pointsContent}
    </View>
  );

  return reordering ? (
    <View style={[styles.container]}>
      {content}
    </View>
  ) : archiving ? (
    <TouchableRipple
      style={[styles.container, habit.archived && { opacity: 0.5 }]}
      onPress={() => onArchive ? onArchive(habit, !habit.archived) : null}
    >
      {content}
    </TouchableRipple>
  ) : (
    <>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flexGrow: 1 }}>
          <TouchableRipple
            style={[styles.container, reordering && { backgroundColor : theme.colors.surface }]}
            onPress={onPress ? () => onPress(habit.id) : undefined}
            onPressIn={onPressIn ? () => onPressIn(habit.id) : undefined}
            onLongPress={onLongPress ? () => onLongPress(habit.id) : undefined}
            delayLongPress={400}
          >
            {content}
          </TouchableRipple>
        </View>
      </View>
      {expandedContent}
    </>
  );
}

const createHabitStyles = (theme: MD3Theme, habitPalette: Palette, index: number) => StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginBottom: 8,
    marginTop: 0,
    borderRadius: 4,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: theme.dark ? theme.colors.elevation.level1 : theme.colors.surface,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: 42,
    gap: 16,
  },
  colorSwatch: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '300%',
    width: 4,
    backgroundColor: habitPalette.primary,
  },
  scopeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 48,
    borderRadius: 4,
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
    // marginLeft: 8,
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
    flexGrow: 1,
    marginTop: 8,
  },
  condition: {
    flexDirection: 'row',
    // alignItems: 'center',
    rowGap: 4,
    gap: 12,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  conditionColorSwatch: {
    height: 6,
    width: 11,
    borderRadius: 3,
  },
  conditionProgressBarComplete: {
  },
  conditionProgressLabel: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexGrow: 1,
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
    gap: 2,
    height: 20,
    marginTop: 4,
    marginBottom: -4,
  },
  completionIcon: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: 20,
    borderRadius: 100,
  },
  expandedContent: {
    // width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: theme.dark ? theme.colors.surface : theme.colors.elevation.level3,


    // marginLeft: -16,
    // marginRight: -16,
    marginTop: -4,
    marginBottom: 12,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 0,
    // borderWidth: 6,
    // borderRadius: 10,
    // borderColor: theme.dark ? theme.colors.elevation.level2 : theme.colors.surface,

  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 4,
    height: 32,
    paddingHorizontal: 16,
    margin: 0,
    justifyContent: 'center',
  },
});
