import { FlatList, PixelRatio, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { useComputedHabits, useHabitStatus, useMeasurements, useMeasurementStatus } from '@s/selectors';
import { getMeasurementRecordingValue, getMeasurementStartDate, getMeasurementTypeData, type Measurement } from '@t/measurements';
import { Button, Icon, IconButton, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimpleDate } from '@u/dates';
import { getHabitCompletion, getHabitPredicateLabel, type ComputedHabit } from '@t/habits';
import { formatValue, intersection, range, triggerHaptic } from '@u/helpers';
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

const Recordings = () => {
  const theme = useTheme();
  const { baseColor, globalPalette, basePalette } = usePalettes();
  const styles = useMemo(() => createStyles(theme, globalPalette), [theme, globalPalette]);

  const measurements = useMeasurements();

  const habits = useComputedHabits();
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const dailyHabits = useMemo(() => activeHabits.filter((h) => !h.isWeekly), [activeHabits]);
  const weeklyHabits = useMemo(() => activeHabits.filter((h) => h.isWeekly), [activeHabits]);

  const today = useToday();

  const [selectedDate, setSelectedDate] = useState(today);
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
      const [complete, _, __] = getHabitCompletion(habit, measurements, [date], mergedRecordingsMap);  
      selectedWeekHabitCompletionMaps[index].set(habit.id, complete);
      return previous + (complete ? habit.points : 0);
    }, 0);
  }), [selectedWeekDates, today, dailyHabits, measurements, mergedRecordingsMap]);
  
  const selectedWeekWeeklyHabitPointTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    weeklyHabits.forEach((habit) => {
      selectedWeekDates.filter((date) => !date.after(today)).find((_, index) => {
        const dates = selectedWeekDates.slice(0, index + 1);
        const [complete] = getHabitCompletion(habit, measurements, dates, mergedRecordingsMap);
        selectedWeekHabitCompletionMaps[index].set(habit.id, complete);

        if (complete) totals[index] += habit.points;
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
  
  const flatListRef = useAnimatedRef<FlatList<{ week: { dates: SimpleDate[] }, elements: JSX.Element[] }>>();
  const weeks = useMemo(() => range(-52, 53).map((i) => ({ dates: SimpleDate.generateWeek(today.getDaysAgo(-7 * i)) })), [today]);

  const handleDateSelection = (date: SimpleDate, updateState: boolean = true) => {
    const firstDate = weeks[0].dates[0];
    const delta = SimpleDate.daysBetween(date, firstDate);
    const weekIndex = Math.floor(delta / 7);
    flatListRef.current?.scrollToIndex({ index: weekIndex });
    updateState && setSelectedDate(date);
  }

  const { window: dimensions } = useDimensions();
  const timelineHeight = useMemo(() => PixelRatio.roundToNearestPixel(108), []);
  const timelineWidth = useMemo(() => PixelRatio.roundToNearestPixel(dimensions.width), [dimensions.width]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / timelineWidth);
    const nextSelectedDate = weeks[index].dates[selectedDayOfWeek];
    setSelectedDate(nextSelectedDate);
  }, [weeks, selectedDayOfWeek, timelineWidth])

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
            <Pressable
              key={date.toString()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => handleDateSelection(date)}
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
                    variant='labelLarge'
                  >
                    {date.getDayOfWeekLabel()}
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
          );
        }, [date, isToday, isSelected, styles]);
      })
    }
  });

  const timeline = useMemo(() => {
    console.log('rendering timeline');
    return (
      <FlatList
        style={{ height: timelineHeight, width: timelineWidth, flexShrink: 0, flexGrow: 0, marginBottom: -24 }}
        ref={flatListRef}
        data={timelineWeeks}
        keyExtractor={({ week }) => week.dates[0].toString()}
        pagingEnabled
        initialScrollIndex={52}
        horizontal
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={Platform.select({ web: handleScroll, default: handleScroll })}
        getItemLayout={(_, index) => ({
          length: timelineWidth,
          offset: timelineWidth * index,
          index,
        })}
        renderItem={({ item }) => {
          return (
            <View style={[styles.timelineContent, { height: timelineHeight, width: timelineWidth }]}>
              {item.elements}
            </View>
          )
        }}
      />
    );
  }, [weeks, timelineWidth, timelineHeight, styles, selectedDate]);

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
          delayLongPress={600}
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
          delayLongPress={600}
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

  const timelineStatuses = useMemo(() => {
    console.log('rendering timeline statuses');
    return displayedMeasurements.length > 0 && (
      <View style={[{ borderRadius: 4, flexShrink: 1, marginHorizontal: 16 }]}>
        <View style={[styles.timelineContent, { width: timelineWidth, marginLeft: -16 }]}>
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
                {!isFuture && (
                  <>
                    {measurementCount > 0 &&
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
                    }
                    {displayedHabits.length > 0 && <Points
                      style={styles.dailyPointTotal}
                      points={total}
                      size='medium'
                      inline
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
    console.log('rendering habit progress bar');
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
        <View style={{ position: 'absolute', width: '100%', top: 16, left: 0, overflow: 'visible' }}>
          <View style={{ alignSelf: 'center' }}>
            <View style={styles.weekPointsContainer}>
              <Points inline size={'x-large'} style={{ width: 48 }} points={selectedWeekPointTotal} textColor={theme.colors.onSurface} iconColor={theme.colors.onSurface} />
              <Text variant='bodyMedium' style={styles.weekPointsDivider}>/</Text>
              <Text variant='bodyLarge' style={{ textAlign: 'right' }}>{perWeekPointTarget}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [displayedHabits.length, dimensions.width, selectedWeekPointTotal, perWeekPointTarget, daysThisWeek, styles]);

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
        <View style={{ width: '100%', alignItems: 'flex-end', flexDirection: 'row'}}>
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

    return (
      <>
        {isToday && <Text variant='bodyMedium' style={{ }}>TODAY</Text>}
        <Text variant='titleLarge' style={{ }}>{selectedDate.toFormattedString(true, false, true)}</Text>
      </>
    );
  }, [showMeasurements, showHabits, isReordering, isArchiving, isToday, selectedDate, styles]);

  const contentHeader = useMemo(() => {
    console.log('rendering content header');
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
        <View style={{ flexDirection: 'row', flexGrow: 1, justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
          {renderSectionTitle()}
        </View>
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
                    setTempRecordingsMap(new Map());
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
                    setTempRecordingsMap(new Map());
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

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.surface} barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <View
        style={styles.container}
      >
        <View style={{ backgroundColor: theme.colors.surface }}>
          {timeline}
          {/* {renderTimelineHeader()} */}
          {habitProgressBar}
          {timelineStatuses}
          {contentHeader}
          {measurements.length > 0 && contentSwitch}
        </View>
          {showMeasurements && 
            <>
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
                            onValueChange={(nextValue: number | null) => {
                              triggerHaptic('impact', ImpactFeedbackStyle.Light);
                              updateRecording(nextValue, id, selectedDate.toString());
                            }}
                            onPress={() => {
                              const nextExpandedMeasurements = new Set([...expandedMeasurements]);
                              nextExpandedMeasurements.has(id) ? nextExpandedMeasurements.delete(id) : nextExpandedMeasurements.add(id);
                              setExpandedMeasurements(nextExpandedMeasurements);
                            }}
                            archiving={showArchivedMeasurements}
                            onArchive={toggleMeasurementArchived}
                          />
                        );
                      })}
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
            </>
          }
          {showHabits && (
            <>
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
                            archiving={showArchivedHabits}
                            onArchive={toggleHabitArchived}
                          />
                        );
                      })}
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
            </>
          )}
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
      borderRadius: 15,

      justifyContent: 'center',
      alignSelf: 'stretch',
      alignItems: 'stretch',
      gap: 4,

    },
    timelineDateContainerToday: {},
    timelineDateContainerSelected: {},
    timelineDateContent: {
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
  onPressOut?: (id: string) => void,
  disabled?: boolean,
  reordering?: boolean,
  archiving?: boolean,
  onArchive?: (measurement: Measurement, archived: boolean) => void,
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
    onPressOut,
    reordering,
    archiving,
    onArchive,
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
  const today = useToday();
  
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

  const { getPalette, getCombinedPalette } = usePalettes();
  const measurementPalette = getPalette(measurement.baseColor);
  const combinedPalette = getCombinedPalette(measurement.baseColor);
  const styles = createMeasurementStyles(theme, measurementPalette, combinedPalette, index);

  const renderControlContent = () => {
    if (reordering) return <Icon source={Icons.drag} size={24} />
    if (archiving) return (
      <Icon
        source={measurement.archived ? Icons.hide : Icons.show}
        size={24}
        color={measurement.archived ? theme.colors.onSurfaceDisabled : undefined}
      />
    );
    const leftButton =
      isCombo ?
        <View style={styles.controlButton} /> :
      isBool ? (
        <IconButton
          style={styles.controlButton}
          size={16}
          icon={Icons.subtract}
          onPress={() => {
            onValueChange ? onValueChange(0) : null;
          }}
        />
      ) : (
        <IconButton
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
          delayLongPress={250}
        />
      );
    const rightButton =
      isCombo ?
        <View style={styles.controlButton} /> :
      isBool ? (
        <IconButton
          style={styles.controlButton}
          size={16}
          icon={Icons.add}
          onPress={() => {
            onValueChange ? onValueChange(1) : null;
          }}
        />
      ) : (
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
      );

    return (
      <View style={styles.controls}>
        {leftButton}
        {value !== null ? (
          <TouchableRipple style={styles.value} disabled={isCombo}>
            {isBool ? (
              <Icon source={value ? Icons.complete : Icons.incomplete} color={combinedPalette.primary} size={14} />
            ) : (
              <Text style={{ color: combinedPalette.primary }} numberOfLines={1} ellipsizeMode='tail' variant='bodyLarge'>
                {formatValue(value, measurement.type, measurement.unit, true)}
              </Text>
            )}
          </TouchableRipple>
        ) : (
          <TouchableRipple style={[styles.value, styles.defaultValue]} onPress={() => onValueChange ? onValueChange(measurement.initial) : null} disabled={isCombo}>
            {isBool ? (
              <Icon source={value ? Icons.complete : Icons.incomplete} color={theme.colors.onSurfaceDisabled} size={14} />
            ) : (
              <Text style={{ color: theme.colors.onSurfaceDisabled }} numberOfLines={1} ellipsizeMode='tail' variant='bodyLarge'>
                {formatValue(measurement.initial, measurement.type, measurement.unit, true)}
              </Text>
            )}
          </TouchableRipple>
        )}
        {rightButton}
      </View>
    );
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
        {!isCombo && value !== null && (
          <TouchableRipple
            style={styles.actionButton}
            onPress={() => {
              onValueChange ? onValueChange(null) : null;
            }}
            disabled={value === null}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon source={Icons.delete} size={14} />
              <Text variant="labelLarge">CLEAR</Text>
            </View>
          </TouchableRipple>
        )}
        <TouchableRipple
          style={styles.actionButton}
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
          <Text variant='bodyMedium' style={styles.aggregateMetricLabel}>
            Total:
          </Text>
          <Text variant='bodyMedium' style={styles.aggregateMetricValue}>
            {count ? totalString : '--'}
          </Text>
        </View>)}
        <View style={styles.aggregateMetric}>
          <Text variant='bodyMedium' style={styles.aggregateMetricLabel}>
            Average:
          </Text>
          <Text variant='bodyMedium' style={styles.aggregateMetricValue}>
            {count ? averageString : '--'}
          </Text>
        </View>
      </View>
    );

    return expanded && (
      <View style={styles.expandedContent}>
        {aggregateContent}
        {actionContent}
      </View>
    );
  }

  const content = (
    <>
      <View style={[styles.content]}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View style={styles.label}>
            <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={styles.labelActivity}>{measurement.name}</Text>
            {measurement.variant ? (
              <>
                <Text variant='bodyLarge' style={styles.labelDivider}> : </Text>
                <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={[styles.labelVariant]}>{measurement.variant}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.completionStatuses}>
            {weekMeasurementValues.map((value, index) => {
              const date = currentDate.getDaysAgo(currentDate.getDayOfWeek() - index);
              const isFuture = date.after(today);
              const isSelected = index === currentDate.getDayOfWeek();
              const hasNotStarted = !startDate || startDate > date.toString();

              const dayLabel = date.getDayOfWeekLetter();

              return (
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
                      source={value === null ? Icons.subtract : Icons.recorded}
                      size={isSelected ? 16 : 12}
                      color={combinedPalette.primary}
                    />
                  )}
                </View>
              );
            })}
      </View>
        </View>
        {renderControlContent()}
      </View>
      {/* {renderExpandedContent()} */}
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
          delayLongPress={300}
        >
          {content}
        </TouchableRipple>
        {renderExpandedContent()}
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
    paddingVertical: 8,
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


    height: 32,
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
    borderRadius: 100,
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
    // flexGrow: 1,
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
  const combinedPalette = getCombinedPalette(habit.baseColor);
  const styles = useMemo(() => createHabitStyles(theme, combinedPalette, index), [theme, combinedPalette, index]);

  const today = useToday();
  const isFuture = currentDate.after(today);

  const firstWeeklyCompletionIndex = habit.isWeekly ? range(0, 7).map((_, index) => {
    const [complete] = getHabitCompletion(habit, measurements, weekDates.slice(0, index + 1), recordingData);
    return complete;
  }).findIndex((completion) => completion) : -1;

  const renderCompletionContent = () => {
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
  };

  const dates = weekDates.slice(habit.isWeekly ? 0 : currentDate.getDayOfWeek(), currentDate.getDayOfWeek() + 1);
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
          const conditionProgress = conditionProgressions[index] || 0;

          const valueString = conditionValue === null ? '-' : formatValue(conditionValue, measurement.type, measurement.unit, false);
          const targetString = formatValue(target, measurement.type, measurement.unit, true);

          return (
            <View key={`${measurementId}${operator}${target}`} style={styles.condition}>
              <View style={styles.conditionMeasurement}>
                <Text variant='bodyMedium'>{measurement.name}</Text>
                {measurement.variant ? (
                  <>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant='bodyMedium'>:</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant='bodyMedium'>{measurement.variant}</Text>
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
  }

  const renderExpandedContent = () => {
    const actionContent = (
      <View style={styles.actionContent}>
        <TouchableRipple
          style={styles.actionButton}
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
    return (
      <View style={{
        marginLeft: 12,
        paddingVertical: 8,
        width: 52,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        borderColor: theme.colors.surfaceDisabled,
        borderLeftWidth: 1,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text
            variant='titleSmall'
            style={{ marginTop: -6, color: complete ? combinedPalette.primary : theme.colors.onSurfaceDisabled }}
          >
            +
          </Text>
          <Points
            style={[styles.dayCompletionPoints]}
            size='large'
            points={habit.points}
            inline
            color={complete ? combinedPalette.primary : theme.colors.onSurfaceDisabled}
          />
        </View>
      </View>
    );
  }
  const pointsContent = useMemo(
    () => !reordering && !archiving && renderPointsContent(),
    [habit.points, complete, combinedPalette, theme, reordering, archiving, styles],
  );

  const content = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
      <View style={{ flexGrow: 1 }}>
        <View style={[styles.content]}>
          <View>
            <Text variant='bodyLarge'>{habit.name}</Text>
            {renderCompletionContent()}
          </View>
          <View style={styles.dayCompletion}>
            {!isFuture && !reordering && !archiving && (
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
            )}
            {reordering && <Icon source={Icons.drag} size={24} />}
            {archiving && <Icon source={habit.archived ? Icons.hide : Icons.show} size={24} color={habit.archived ? theme.colors.onSurfaceDisabled : undefined}/>}
          </View>
        </View>
        {expanded && renderConditionContent()}
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
          delayLongPress={300}
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
    paddingVertical: 8,
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
  conditionMeasurement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexGrow: 1,
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
    gap: 2,
    height: 20,
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
