import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, IconButton, Surface, Switch, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { Area, Chart, Line } from 'react-native-responsive-linechart';
import { formatNumber, formatValue, movingAverage, range, triggerHaptic } from '@u/helpers';
import { useComputedHabits, useMeasurements } from '@s/selectors';
import { SimpleDate } from '@u/dates';
import Points from '@c/Points';
import Heatmap from '@c/Heatmap';
import { computeHabit, getHabitCompletion, type ComputedHabit } from '@t/habits';
import { getMeasurementRecordingValue, getMeasurementTypeIcon, type Measurement, type MeasurementRecording } from '@t/measurements';
import BottomDrawer, { type BottomDrawerItem } from '@c/BottomDrawer';
import useDimensions from '@u/hooks/useDimensions';
import { Icons } from '@u/constants/Icons';
import type { Palette } from '@u/colors';
import { usePalettes } from '@u/hooks/usePalettes';
import { router } from 'expo-router';
import { useToday } from '@u/hooks/useToday';
import { useDispatch } from 'react-redux';
import { callGenerateSampleData } from '@s/dataReducer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QuickStartButton from '@c/QuickStartButton';
import { MeasurementLabel } from '@c/Label';

type BucketSize = 'day' | 'week' | 'month';

const HABIT_CHART_DURATION_ITEMS: BottomDrawerItem<number>[] = [
  { title: '1M', value: 1 },
  { title: '3M', value: 3 },
  { title: '1Y', value: 12 },
  { title: 'ALL', value: 100000 },
];

const HABIT_BUCKET_SIZE_ITEMS: BottomDrawerItem<BucketSize>[] = [
  { title: 'Day', value: 'day' },
  { title: 'Week', value: 'week' },
  { title: 'Month', value: 'month' },
];

const MEASUREMENT_CHART_DURATION_ITEMS: BottomDrawerItem<number>[] = [
  { title: '1W', value: 7 },
  { title: '1M', value: 30 },
  { title: '3M', value: 90 },
  { title: '1Y', value: 365 },
  { title: 'ALL', value: 100000 },
];

const getTrendlineItems = (bucketSize: BucketSize): BottomDrawerItem<number>[] => {
  if (bucketSize === 'day') {
    return [
      { title: 'None', value: 0, icon: undefined },
      { title: '7-day average', value: 7, icon: undefined },
      { title: '14-day average', value: 14, icon: undefined },
      { title: '30-day average', value: 30, icon: undefined },
    ];
  }
  if (bucketSize === 'week') {
    return [
      { title: 'None', value: 0, icon: undefined },
      { title: '4-week average', value: 4, icon: undefined },
      { title: '13-week average', value: 13, icon: undefined },
      { title: '26-week average', value: 26, icon: undefined },
    ];
  }
  return [
    { title: 'None', value: 0, icon: undefined },
    { title: '3-month average', value: 3, icon: undefined },
    { title: '6-month average', value: 6, icon: undefined },
    { title: '12-month average', value: 12, icon: undefined },
  ];
};

const MEASUREMENT_TRENDLINE_ITEMS: BottomDrawerItem<number>[] = [
  { title: 'None', value: 0, icon: undefined },
  { title: '7-day average', value: 7, icon: undefined },
  { title: '14-day average', value: 14, icon: undefined },
  { title: '30-day average', value: 30, icon: undefined },
];

const History = () => {  
  const measurements = useMeasurements();
  const habits = useComputedHabits();
  const dispatch = useDispatch();
  const { top, bottom } = useSafeAreaInsets();

  const theme = useTheme();

  const s = createStyles(theme);

  const computeMeasurementRecordingDates = (recordings: MeasurementRecording[], startDate?: SimpleDate, endDate?: SimpleDate) => {
    const dates = recordings
      .filter(({ value }) => value !== undefined && value !== null)
      .map(({ date }) => date);
    
    return [...(new Set(dates))]
      .sort((a, b) => a.localeCompare(b))
      .map((date) => SimpleDate.fromString(date))
      .filter((date) => (!startDate || !date.before(startDate)) && (!endDate || !date.after(endDate)));
  }
  const computeAllMeasurementRecordingDates = (measurements: Measurement[], startDate?: SimpleDate, endDate: SimpleDate = SimpleDate.today()) => {
    const dates = new Map<string, SimpleDate[]>();
    measurements.forEach((measurement) => {
      let recordings = measurement.recordings;
      if (measurement.type === 'combo') {
        const leftMeasurement = measurements.find(({ id }) => id === measurement.comboLeftId);
        const rightMeasurement = measurements.find(({ id }) => id === measurement.comboRightId);
        recordings = [...(leftMeasurement?.recordings || []), ...(rightMeasurement?.recordings || [])];
      }
      dates.set(measurement.id, computeMeasurementRecordingDates(recordings, startDate, endDate))
    });
    return dates;
  }
  const measurementRecordingDates = useMemo(() => computeAllMeasurementRecordingDates(measurements), [measurements]);

  return (
    <ScrollView style={[s.container, { paddingTop: top, paddingBottom: bottom }]}>
      <View style={s.cards}>
        {useMemo(() => <MonthSummaryCard />, [])}
        <HabitChartCard measurementRecordingDates={measurementRecordingDates} />
        {measurements.length && !habits.length && (
          <>
            <View style={s.noData}>
              <View style={s.noDataIcon}>
                <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
              </View>
              <Text style={s.noDataText} variant='bodyLarge'>No habits</Text>
            </View>
            <QuickStartButton />
          </>
        )}
        <MeasurementChartCard measurementRecordingDates={measurementRecordingDates} />
        {!measurements.length && (
          <>
            <View style={s.noData}>
              <View style={s.noDataIcon}>
                <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
              </View>
              <Text style={s.noDataText} variant='bodyLarge'>No measurements</Text>
            </View>
            <QuickStartButton />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: MD3Theme, palette?: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.dark ? theme.colors.surface : theme.colors.elevation.level3,
  },
  cards: {
    paddingVertical: 16,
    gap: 16,
  },
  cardContainer: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,

    flexGrow: 1,

    backgroundColor: theme.dark ? theme.colors.elevation.level1 : theme.colors.surface,
  },
  cardPartial: {
    minWidth: 200,
    width: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: -6,
  },
  title: {
    flex: 1,
  },
  subheader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
  },
  chartControls: {
    flexGrow: 1,
    flexShrink: 1,
    width: '50%',
    gap: 8,
    maxWidth: 360,
  },
  chartStats: {
    flexGrow: 1,
    flexShrink: 1,
    width: '50%',
    backgroundColor: theme.colors.elevation.level3,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 360,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  },
  chartStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'
  },
  chart: {
    paddingTop: 52,
    paddingBottom: 24,
  },
  chartTicks: {
    
  },
  chartTick: {
    position: 'absolute',
    width: '100%',
    opacity: 0.5,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTickLabel: {
    marginHorizontal: 6,
    color: theme.colors.onSurface,
  },
  chartTickLine: {
    flexGrow: 1,
    borderTopColor: theme.colors.onSurface,
    borderTopWidth: 1,
    height: 0,
    opacity: 0.3,
  },
  chartSelectionContainer: {
    top: 6,
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  chartSelection: {
    flexGrow: 0,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 0,
    backgroundColor: theme.dark ? theme.colors.elevation.level1 : theme.colors.surface,
  },
  chartSelectionRow: {
    flexDirection: 'row',
    gap: 4,
  },
  chartSelectionLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartSelectionValue: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartSelectionLine: {
    position: 'absolute',
    height: 320,
    borderLeftWidth: 2,
  },
  chartDurationButtons: {
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  },
  durationButton: {
    borderRadius: 4,
  },
  durationButtonContent: {
    minWidth: 48,
    height: 36,
  },
  durationButtonContentSelected: {
    
  },
  noData: {
    flexDirection: 'row',
    paddingTop: 32,
    paddingBottom: 16,
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
    marginBottom: 4,
    borderRadius: 4,
    width: 280,
  },
  noDataButtonContent: {
    paddingVertical: 4,
  },
  noDataButtonText: {
  },
  sampleDataButton: {
    width: 280,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sampleDataButtonContent: {
    paddingVertical: 4,
  },
  sampleDataButtonText: {
    color: theme.colors.surface,
  },
});

function ChartDropdown<T>({ label, selectedItem, items, onChange, palette, renderSelectedItem,
}: {
  label: string
  selectedItem: BottomDrawerItem<T> | null
  renderSelectedItem?: (item: BottomDrawerItem<T>) => JSX.Element
  items: BottomDrawerItem<T>[]
  onChange: (item: { title: string, icon?: string, value: T }) => void
  palette: Palette
}): JSX.Element {
  const theme = useTheme();
  const styles = createDropdownStyles(theme, palette);

  return (
    <BottomDrawer
      title={label}
      anchor={(
        <TouchableRipple
          style={styles.dropdownButton}
        >
          <View
            style={styles.dropdownButtonContent}    
          >
            {selectedItem ? renderSelectedItem ? renderSelectedItem(selectedItem) :(
              <>
                <Text ellipsizeMode='tail' variant='titleSmall' numberOfLines={1}>
                  {selectedItem.value ? selectedItem.title : `Select ${label.toLocaleLowerCase()}`}
                </Text>
              </>
            ) : (
              <>
                <Text variant='labelMedium' style={styles.dropdownButtonText}>
                  -- Select {label} --
                </Text>
              </>
            )}
            <Icon source={Icons.down} size={16} />
          </View>
        </TouchableRipple>
      )}
      selectedItem={selectedItem}
      onSelect={(item) => onChange(item)}
      items={items}
      palette={palette}
    />
  );
}

const createDropdownStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  dropdownButton: {
    backgroundColor: theme.colors.elevation.level3,
    // backgroundColor: palette.backdrop,
    borderRadius: 4,
    overflow: 'hidden',
    flexShrink: 1,
    flexGrow: 1,
    height: 42,
  },
  dropdownButtonContent: {
    flexShrink: 1,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    height: 42,
    paddingHorizontal: 10,
  },
  dropdownButtonText: {
    color: theme.colors.onSurface,
  },
});

type MonthSummaryCardProps = {

};

const MonthSummaryCard = (_: MonthSummaryCardProps) : JSX.Element | null => {
  const theme = useTheme();
  
  const today = useToday();
  const [firstDate, setFirstDate] = useState(new SimpleDate(today.year, today.month, 1));

  const month = firstDate.month;
  const year = firstDate.year;
  const isCurrentMonth = today.month === month && today.year === year;

  const [showOptions, setShowOptions] = useState(false);
  const [includeWeeklyHabits, setIncludeWeeklyHabits] = useState(true);
  const [useRelativeHabits, setUseRelativeHabits] = useState(false);

  const habits = useComputedHabits();
  const measurements = useMeasurements();
  const filteredHabits = habits.filter(({ isWeekly }) => includeWeeklyHabits || !isWeekly);
  const dailyPointTarget = filteredHabits.reduce((previous: number, current: ComputedHabit) => {
    return previous + current.points * (current.isWeekly ? 1 : current.daysPerWeek);
  }, 0) / 7;

  const monthDates = SimpleDate.generateMonth(month, year);

  const monthDatePoints = monthDates.map((monthDate) => {
    if (monthDate.after(today)) return 0;

    const weekDates = SimpleDate.generateWeek(monthDate).slice(0, monthDate.getDayOfWeek() + 1);
    return filteredHabits.reduce((datePoints, habit) => {
      const [complete] = getHabitCompletion(computeHabit(habit, useRelativeHabits ? monthDate : today), measurements, habit.isWeekly ? weekDates : [monthDate]);
      if (!complete) return datePoints;
      if (!habit.isWeekly || monthDate.getDayOfWeek() === 0) return datePoints + habit.points;

      const previousDateWeekDates = weekDates.slice(0, -1);
      const [completePreviousDate] = getHabitCompletion(computeHabit(habit, useRelativeHabits ? monthDate : today), measurements, previousDateWeekDates);
      return datePoints + (completePreviousDate ? 0 : habit.points);
    }, 0);
  });
  const monthTotalPoints = monthDatePoints.reduce((sum, curr) => sum + curr, 0);
  
  const monthDayOffset = firstDate.getDayOfWeek();
  const monthHeatmapData: (number | null)[][] = [0, 1, 2, 3, 4, 5].map((row) => {
    return [0, 1, 2, 3, 4, 5, 6].map((column) => {
      const day = row * 7 + column - monthDayOffset + 1;
      const lastDay = monthDates.length;
      return (day > 0 && day <= lastDay) ? 0 : null;
    });
  }).filter((week) => week.findIndex((day) => day !== null) !== -1);

  monthDates.forEach((date, index) => {
    const points = monthDatePoints[index];
    const dayIndex = date.day + monthDayOffset - 1;

    const row = Math.floor(dayIndex / 7);
    const column = dayIndex % 7;

    monthHeatmapData[row][column] = points;
  });

  const daysThisMonth = (isCurrentMonth ? today.day : monthDates.length);
  const pointsPerDayMonth = monthTotalPoints / daysThisMonth;

  const cardStyles = createStyles(theme);
  const { globalPalette } = usePalettes();
  const styles = createMonthSummaryStyles(theme, globalPalette);

  return habits.length === 0 ? null : (
    <Surface style={cardStyles.cardContainer} elevation={0}>
      <View style={cardStyles.header}>
        <Text style={[cardStyles.title, styles.title]} variant='bodyLarge'>{firstDate.toFormattedMonthYear()}</Text>
        <IconButton
          style={styles.headerButton}
          icon={Icons.left}
          size={20}
          onPress={() => {
            setFirstDate(firstDate.getMonthsAgo(1));
          }}
        />
        <IconButton
          style={styles.headerButton}
          icon={Icons.right}
          size={20}
          onPress={() => {
            setFirstDate(firstDate.getMonthsAgo(-1));
          }}
          disabled={today.year === firstDate.year && today.month === firstDate.month}
          />
        <IconButton
          style={{ ...styles.headerButton }}
          // mode={showOptions ? 'contained-tonal' : undefined}
          containerColor={showOptions ? globalPalette.backdrop : undefined}
          iconColor={theme.colors.onSurface}
          size={18}
          icon={Icons.settings}
          onPress={() => setShowOptions(!showOptions)}
        />
      </View>
      <View style={cardStyles.subheader}>
        <View style={styles.pointsPerDay}>
          <Text style={styles.pointsPerDayLabel} variant='bodyLarge'>Total </Text>
          <Points points={monthTotalPoints} size='large' decimals={0} color={globalPalette.primary} inline />
        </View>
        <View style={styles.pointsPerDay}>
          <Text style={styles.pointsPerDayLabel} variant='bodyLarge'>Average </Text>
          <Points points={pointsPerDayMonth} size='large' decimals={1} color={globalPalette.primary} inline />
        </View>
      </View>
      <Heatmap data={monthHeatmapData} target={dailyPointTarget} />
      {showOptions && (
        <View style={styles.options}>
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel} variant='labelMedium'>INCLUDE WEEKLY HABITS</Text>
            <Switch
              color={globalPalette.primary}
              trackColor={{ true: globalPalette.backdrop, false: globalPalette.disabled }}
              value={includeWeeklyHabits}
              onValueChange={(value) => setIncludeWeeklyHabits(value)}
              />
          </View>
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel} variant='labelMedium'>USE RELATIVE HABITS</Text>
            <Switch
              color={globalPalette.primary}
              trackColor={{ true: globalPalette.backdrop, false: globalPalette.disabled }}
              value={useRelativeHabits}
              onValueChange={(value) => setUseRelativeHabits(value)}
            />
          </View>
        </View>
      )}
    </Surface>
  )
};

const createMonthSummaryStyles = (theme: MD3Theme, globalPalette: Palette) => StyleSheet.create({
  title: {
    fontSize: 22,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginVertical: 0,
    marginRight: 0,
    marginLeft: 12,
  },
  pointsPerDay: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'baseline',
    marginBottom: 8,
    // paddingHorizontal: 14,
    // paddingVertical: 4,
    borderRadius: 15,

    // backgroundColor: globalPalette.backdrop,
  },
  pointsPerDayLabel: {

  },
  options: {
    marginTop: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    
  },
});

const HabitChartCard = ({
  measurementRecordingDates,
}: {
  measurementRecordingDates: Map<string, SimpleDate[]>
}) => {
  const measurements = useMeasurements();
  const today = useToday();
  const theme = useTheme();
  const { globalPalette } = usePalettes();
  const dimensions = useDimensions();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [selectedHabitDataIndex, setSelectedHabitDataIndex] = useState(-1);
  const [habitChartDuration, setHabitChartDuration] = useState(HABIT_CHART_DURATION_ITEMS[1]);
  
  const [habitBucketSize, setHabitBucketSize] = useState(HABIT_BUCKET_SIZE_ITEMS[1]);
  const habitBucketSizeDropdown = useMemo(() => (
    <ChartDropdown
      label='Duration'
      palette={globalPalette}
      selectedItem={habitBucketSize}
      items={HABIT_BUCKET_SIZE_ITEMS}
      onChange={(item) => {
        setHabitBucketSize(item);
        setSelectedHabitDataIndex(-1);
      }}
    />
  ), [habitBucketSize, globalPalette]);

  const habitTrendlineItems = useMemo(() => getTrendlineItems(habitBucketSize.value), [habitBucketSize.value]);
  const [habitTrendlineValue, setHabitTrendlineValue] = useState(habitTrendlineItems[1].value);
  const habitTrendline = habitTrendlineItems.find(({ value }) => value === habitTrendlineValue) || habitTrendlineItems[1];
  const habitTrendlineDropdown = useMemo(() => (
    <ChartDropdown
      label='Trendline'
      palette={globalPalette}
      selectedItem={habitTrendline}
      items={habitTrendlineItems}
      onChange={(item) => {
        setHabitTrendlineValue(item.value);
      }}
    />
  ), [habitTrendlineValue, habitTrendlineItems, globalPalette]);
    
  const firstMeasurementDate = useMemo(() => [...measurementRecordingDates.values()].reduce((min, dates) => {
    return !dates[0] || min.toString() < dates[0].toString() ? min : dates[0];
  }, today), [measurements, today.toString()]);

  const habits = useComputedHabits();
  const computeHabitPointData = useCallback((
    startDate: SimpleDate,
    endDate: SimpleDate = today,
    useRelative: boolean = false,
    includeWeekly: boolean = true,
  ): Map<string, number> => {
    const completions = new Map<string, Map<string, boolean>>();
    const points = new Map<string, number>();

    let currentDate: SimpleDate = startDate.getDaysAgo(startDate.getDayOfWeek());
    let previousDate: SimpleDate | undefined;
    
    const filteredHabits = includeWeekly ? habits : habits.filter(({ isWeekly }) => !isWeekly);

    while (currentDate.toString() <= endDate.toString()) {
      let datePoints = 0;

      const dateCompletions = new Map<string, boolean>();
      const isFirstDayOfWeek = currentDate.getDayOfWeek() === 0;
      const previousCompletions = !isFirstDayOfWeek && previousDate && completions.get(previousDate.toString());
      
      const currentWeekDates = SimpleDate.generateWeek(currentDate).slice(0, currentDate.getDayOfWeek() + 1);
      filteredHabits.forEach((habit) => {
        const [dateHabitCompletion] = getHabitCompletion(computeHabit(habit, useRelative ? currentDate : today), measurements, habit.isWeekly ? currentWeekDates : [currentDate]);
        dateCompletions.set(habit.id, dateHabitCompletion);
        
        if (!dateHabitCompletion) return;

        if (!habit.isWeekly) datePoints += habit.points;
        else if (!previousCompletions || !previousCompletions.get(habit.id)) datePoints += habit.points;
      });

      completions.set(currentDate.toString(), dateCompletions);
      points.set(currentDate.toString(), datePoints);
      
      previousDate = currentDate;
      currentDate = currentDate.getDaysAgo(-1);
    }

    return points;
  }, [habits, measurements]);
  
  const habitPoints = useMemo(() => {
    const points = computeHabitPointData(firstMeasurementDate);
    return points;
  }, [computeHabitPointData, firstMeasurementDate.toString()]);

  const adjustedBuckets = useMemo(() => {
    const referenceDate = today.getMonthsAgo(habitBucketSize.value === 'month' ? 10000 : habitChartDuration.value).getDaysAgo(-1);
    let startDate = referenceDate.before(firstMeasurementDate) ? firstMeasurementDate : referenceDate;
    startDate =
      habitBucketSize.value === 'day' ? startDate :
      habitBucketSize.value === 'week' ? startDate.getDaysAgo(startDate.getDayOfWeek()) :
      habitBucketSize.value === 'month' ? new SimpleDate(startDate.year, startDate.month, 1) : today;
    const result = [];

    let currentDate = startDate.before(firstMeasurementDate) ? startDate : firstMeasurementDate;
    let currentBucket: { title: string, x: number, y: number } | null = null;
    let bucketOffset = 0;
    while (currentDate.toString() <= today.toString()) {
      if (habitBucketSize.value === 'day') {
        currentBucket && result.push(currentBucket);
        currentBucket = { title: `${currentDate.toFormattedString(true)}`, x: currentBucket ? currentBucket.x + 1 : 0, y: 0};
      } else if (habitBucketSize.value === 'week' && currentDate.getDayOfWeek() === 0) {
        currentBucket && result.push(currentBucket);
        currentBucket = { title: `${currentDate.toFormattedString(false, false, false, true)} - ${currentDate.getDaysAgo(-6).toFormattedString(false, false, false, true)}`, x: currentBucket ? currentBucket.x + 1 : 0, y: 0};
      } else if (habitBucketSize.value === 'month' && currentDate.day === 1) {
        currentBucket && result.push(currentBucket);
        currentBucket = { title: `${currentDate.toFormattedMonthYear()}`, x: currentBucket ? currentBucket.x + 1 : 0, y: 0};
      }

      if (currentDate.equals(startDate)) bucketOffset = currentBucket?.x || 0;

      if (currentBucket) {
        currentBucket.y += habitPoints.get(currentDate.toString()) || 0;
      }

      currentDate = currentDate.getDaysAgo(-1);
    }

    if (currentBucket) result.push(currentBucket);
    const adjustedResult = result.map((bucket) => ({ ...bucket, x: bucket.x - bucketOffset }));
    return adjustedResult;
  }, [habits, measurements, today.toString(), habitBucketSize.value, habitChartDuration.value, firstMeasurementDate.toString()]);

  const averageData = useMemo(() => {
    const averageValues = movingAverage(adjustedBuckets.map(({ y }) => y), habitTrendline.value);
    return adjustedBuckets
      .map(({ x }, index) => ({
        x,
        y: averageValues[index],
      }))
    },
    [adjustedBuckets]
  );
  
  const visibleBucketData = adjustedBuckets.filter((data) => data.x >= 0);
  const visibleAverageData = averageData.filter((data): data is { x: number, y: number } => data.x >= 0);
  const filteredAverageData = visibleAverageData.filter((data): data is { x: number, y: number } => data.y !== null);
  const combinedDataValues = [...visibleBucketData, ...filteredAverageData].map(({ y }) => y);

  let dotSize = 8;
  if (visibleBucketData.length > 400) dotSize = 1;
  else if (visibleBucketData.length > 200) dotSize = 2;
  else if (visibleBucketData.length > 80) dotSize = 4;
  else if (visibleBucketData.length > 40) dotSize = 5;
  else if (visibleBucketData.length > 20) dotSize = 6;

  const chartWidth = dimensions.window.width - 32 - 32;
  const chartPadding = 8;
  const chartHeight = 300;

  const verticalStep = 1;
  const verticalMinRaw = 0;
  const verticalMinSteps = Math.floor(verticalMinRaw / verticalStep);
  const verticalMinUnits = verticalMinSteps * verticalStep;
  const verticalMaxRaw = combinedDataValues.length ? Math.max(...combinedDataValues) : 1;
  const verticalMaxSteps = Math.max(Math.ceil(verticalMaxRaw / verticalStep), verticalMinSteps + 1);
  const verticalMaxUnits = verticalMaxSteps * verticalStep;
  const verticalOffset = (verticalMaxUnits - verticalMinUnits) * (chartPadding / chartHeight);

  let horizontalMin = 0;
  const horizontalMax = Math.max(visibleBucketData.length - 1, 1);
  const horizontalOffset = (horizontalMax - horizontalMin) * (chartPadding / chartWidth);
  
  const habitChartInputs = [habits, measurements, habitBucketSize.value, habitTrendline.value, habitChartDuration.value, globalPalette, s, chartWidth];
  
  const chartStats = useMemo(() => {
    const total = visibleBucketData.reduce((acc, curr) => acc + curr.y || 0, 0);
    const average = visibleBucketData.length ? total / visibleBucketData.length : 0;
    return (
      <View style={[s.chartStats, { backgroundColor: globalPalette.backdrop }]}>
        <View style={s.chartStat}>
          <Text variant='bodyMedium'>Average</Text>
          <Points points={average} decimals={1} size='medium' inline />
        </View>
        <View style={s.chartStat}>
          <Text variant='bodyMedium'>Total</Text>
          <Points points={total} size='medium' inline />
        </View>
        <View style={s.chartStat}>
          <Text variant='bodyMedium'>{habitBucketSize.title}s</Text>
          <Text variant='titleMedium'>{visibleBucketData.length}</Text>
        </View>
      </View>
    )
  }, habitChartInputs);

  const habitArea = useMemo(() => {
    return visibleBucketData.length > 1 ? (
      <Area
        data={visibleBucketData}
        smoothing='cubic-spline'
        theme={{
          gradient: {
            from: {
              color: globalPalette.primary,
              opacity: 0.25
            },
            to: {
              color: globalPalette.primary,
              opacity: 0
            }
          }
        }}
      />
    ) : null;
  }, habitChartInputs);
  
  const habitAverage = useMemo(() => {
    return visibleBucketData.length > 1 && habitTrendline.value && filteredAverageData.length > 1 ? (
      <Line
        data={filteredAverageData}
        theme={{
          stroke: {
            color: globalPalette.primary,
            width: 2,
            dashArray: [8, 4],
          },
          scatter: {
            default: {
              width: 0,
              height: 0,
            }
          }
        }}
      />
    ) : null;
  }, habitChartInputs);

  const habitLine = useMemo(() => {
    return visibleBucketData.length && dotSize ? (
      <Line
        data={visibleBucketData}
        theme={{
          stroke: {
            width: 0,
          },
          scatter: {
            default: {
              width: dotSize,
              height: dotSize,
              color: globalPalette.primary,
              rx: dotSize,
            },
          }
        }}
        hideTooltipOnDragEnd
        onTooltipSelect={(_, index) => {
          triggerHaptic('selection');
          setSelectedHabitDataIndex(index);
        }}
        onTooltipSelectEnd={() => {
          setSelectedHabitDataIndex(-1);
        }}
        initialTooltipIndex={horizontalMax}
      />
    ) : null;
  }, habitChartInputs);

  const chart = useMemo(() => {
    return (
      <View style={{ overflow: 'hidden' }}>
        <Chart
          xDomain={{
            min: horizontalMin - horizontalOffset,
            max: horizontalMax + horizontalOffset,
          }}
          yDomain={{
            min: verticalMinUnits - verticalOffset,
            max: verticalMaxUnits + verticalOffset,
          }}
          style={{
            height: chartHeight,
            width: chartWidth,
          }}
          padding={{
            top: 0,
            bottom: 0,
          }}
        >
          {habitArea}
          {habitAverage}
          {habitLine}
        </Chart>
      </View>
    )
  }, habitChartInputs);

  const chartTicks = useMemo(() => {
    const verticalSteps = verticalMaxSteps - verticalMinSteps;
    const stepsPerTick = Math.ceil(verticalSteps / 5);
    const tickCount = Math.ceil(verticalSteps / stepsPerTick); 
    const ticks = range(0, tickCount)
      .map((tickIndex) => {
        const stepsFromBottom = tickIndex * stepsPerTick;
        const unitsFromBottom = stepsFromBottom * verticalStep;
        const unitsFromZero = verticalMinUnits + unitsFromBottom;
        return unitsFromZero;
      });

    return (
      <View style={s.chartTicks} pointerEvents='none'>
        {ticks.map((value) => {
          const height = 24;
          const bottom = ((value - verticalMinUnits) / (verticalMaxUnits - verticalMinUnits)) * (300 - 2 * chartPadding) + chartPadding - height / 2;
          return value !== verticalMaxUnits && (
            <View key={value} style={{ ...s.chartTick, bottom, height, }}>
              <View style={{ ...s.chartTickLine, flexGrow: 0, width: 8 }} />
              <Text style={s.chartTickLabel} variant='bodyMedium'>{formatNumber(value)}</Text>
              <View style={s.chartTickLine} />
            </View>
          )
        })}
        <View style={{ ...s.chartTick, bottom: (300 - 2 * chartPadding) + chartPadding - 24 / 2, height: 24, }}>
          <View style={{ ...s.chartTickLine, flexGrow: 0, width: 8 }} />
          <Text style={s.chartTickLabel} variant='bodyMedium'>{formatNumber(verticalMaxUnits)}</Text>
          <View style={s.chartTickLine} />
        </View>
      </View>
    )
  }, habitChartInputs);

  const chartSelection = useMemo(() => {
    const selectedBucket = visibleBucketData[selectedHabitDataIndex] || null;
    const selectedBucketString = selectedBucket && `${selectedBucket.title}: `;
    
    const selectedDateValue = selectedBucket && selectedBucket.y;
    
    const selectedDateAverage = selectedHabitDataIndex === -1 ? null : visibleAverageData[selectedHabitDataIndex]?.y;
    const selectedDateAverageLabel = `${habitTrendline.title || ''}: `;

    const ratio = selectedHabitDataIndex / horizontalMax;
    const justifyContent = ratio > 0.8 ? 'flex-end' : 'flex-start';
    return selectedHabitDataIndex < 0 ? null : (
      <View style={s.chartSelectionContainer}>
        <View
          style={
            [s.chartSelectionLine, 
            {
              top: 27 - chartPadding,
              left: (selectedHabitDataIndex / horizontalMax) * (chartWidth - 2 * chartPadding) + chartPadding - 1,
              borderColor: globalPalette.primary,
            }
          ]}
        />
        <View style={{ flexGrow: (selectedHabitDataIndex / horizontalMax) }} />
        <View style={s.chartSelection}>
          <View style={{ ...s.chartSelectionRow, justifyContent }}>
            <Text style={s.chartSelectionLabel} numberOfLines={1} variant='bodyMedium'>
              {selectedBucketString}
            </Text>
            <Points points={selectedDateValue} size='x-small' inline />
          </View>
          {selectedDateAverage !== null ? (
            <View style={{ ...s.chartSelectionRow, justifyContent }}>
              <Text style={s.chartSelectionLabel} numberOfLines={1} variant='bodyMedium'>
                {selectedDateAverageLabel}
              </Text>
              <Points points={selectedDateAverage} decimals={1} size='x-small' inline />
            </View>
          ) : null}
        </View>
        <View style={{ flexGrow: 1 - (selectedHabitDataIndex / horizontalMax) }} />
      </View>
    )
  }, [...habitChartInputs, selectedHabitDataIndex]);

  const chartDurationButtons = useMemo(() => {

    return (
      <View style={{ ...s.cardRow, ...s.chartDurationButtons }}>
        {HABIT_CHART_DURATION_ITEMS.map((item) => {
          const isMonthly = habitBucketSize.value === 'month';
          const selected = (isMonthly && item.title === 'ALL') || (!isMonthly && item.value === habitChartDuration.value);
          const disabled = isMonthly && item.title !== 'ALL';
          return (
            <Button
              key={item.title}
              onPress={() => {
                setSelectedHabitDataIndex(-1);
                setHabitChartDuration(item);
              }}
              mode={'text'}
              style={s.durationButton}
              textColor={globalPalette.primary}
              contentStyle={[s.durationButtonContent, selected && { backgroundColor: globalPalette.backdrop }]}
              compact
              disabled={disabled}
            >
              <Text variant='labelLarge' style={disabled && { color: theme.colors.onSurfaceDisabled }}>
                {item.title}
              </Text>
            </Button>
          );
        })}
      </View>
    )
  }, habitChartInputs);

  return habits.length === 0 ? null : (
    <Surface style={s.cardContainer} elevation={0}>
      <Text variant='titleLarge'>Habits</Text>
      <View style={{ ...s.cardRow, gap: 16, alignItems: 'flex-start', marginTop: 8 }}>
        <View style={s.chartControls}>
          {habitBucketSizeDropdown}
          {habitTrendlineDropdown}
        </View>
        {chartStats}
      </View>
      <View style={s.cardRow}>
        <View style={{ paddingTop: 52, paddingBottom: 0 }}>
          {chart}
          {chartTicks}
          {chartSelection}
        </View>
      </View>
      {chartDurationButtons}
    </Surface>
  );
};

const MeasurementChartCard = ({
  measurementRecordingDates,
}: {
  measurementRecordingDates: Map<string, SimpleDate[]>
}) => {
  const measurements = useMeasurements();
  const today = useToday();
  const theme = useTheme();
  const dimensions = useDimensions();

  const { globalPalette, getCombinedPalette } = usePalettes();

  const [selectedMeasurementDataIndex, setSelectedMeasurementDataIndex] = useState(-1);
  const [measurementChartDuration, setMeasurementChartDuration] = useState(MEASUREMENT_CHART_DURATION_ITEMS[1]);

  const [selectedMeasurementId, setSelectedMeasurementId] = useState(measurements[0]?.id);
  const measurementId = selectedMeasurementId || measurements[0]?.id;
  const selectedMeasurement = measurements.find(({ id }) => id === measurementId) || null;
  const measurementPalette = useMemo(() => getCombinedPalette(selectedMeasurement?.baseColor), [selectedMeasurement?.baseColor, getCombinedPalette]);
  const s = useMemo(() => createStyles(theme), [theme]);

  const measurementItems: BottomDrawerItem<string>[] = useMemo(() => measurements.map((measurement) => {
    const { id, name: activity, category, type } = measurement;
    return {
      title: `${category ? `${category} : ` : ''}${activity}`,
      renderItem: () => <MeasurementLabel measurement={measurement} size='large' />,
      value: id,
      icon: getMeasurementTypeIcon(type),
    }
  }), [measurements]);

  const selectedMeasurementItem = measurementItems.find(({ value }) => value === measurementId) || null;
  const measurementDropdown = useMemo(() => (
    <ChartDropdown
      label='Measurement'
      palette={measurementPalette}
      selectedItem={selectedMeasurementItem}
      items={measurementItems}
      renderSelectedItem={selectedMeasurement ? (item) => <MeasurementLabel measurement={selectedMeasurement} size='medium' /> : undefined}
      onChange={(item) => {
        setSelectedMeasurementId(item.value);
        setSelectedMeasurementDataIndex(-1);
      }}
    />
  ), [measurementPalette, selectedMeasurementItem, measurementItems]);

  const [measurementTrendline, setMeasurementTrendline] = useState(MEASUREMENT_TRENDLINE_ITEMS[1]);
  const measurementTrendlineDropdown = useMemo(() => (
    <ChartDropdown
      label='Trendline'
      palette={measurementPalette}
      selectedItem={measurementTrendline}
      items={MEASUREMENT_TRENDLINE_ITEMS}
      onChange={(item) => {
        setMeasurementTrendline(item);
      }}
    />
  ), [measurementPalette, measurementTrendline]);

  const { id = '', step = 1, unit, type } = selectedMeasurement || {};
  const isBool = type === 'bool';
  const isTime = type === 'time';
  const selectedMeasurementRecordingDates = measurementRecordingDates.get(id) || [];

  const firstDateWithData = selectedMeasurementRecordingDates[0];
  let chartDuration = measurementChartDuration.value;
  if (firstDateWithData) chartDuration = Math.min(SimpleDate.daysBetween(today, firstDateWithData), chartDuration - 1);

  const selectedMeasurementData = useMemo(() => selectedMeasurementRecordingDates.map((date) => {
    const daysAgo = SimpleDate.daysBetween(today, date);
    const value = getMeasurementRecordingValue(id, date, measurements);
    return value === null ? null : {
      x: chartDuration - daysAgo,
      y: value,
    };
  }).filter((data) => data !== null), [id, measurementRecordingDates, chartDuration, today]);
  const selectedVisibleData = useMemo(() => selectedMeasurementData.filter(({ x }) => x >= 0), [selectedMeasurementData]);

  const averageData = useMemo(() => {
    const averageValues = movingAverage(selectedMeasurementData.map(({ y }) => y), measurementTrendline.value);
    return selectedMeasurementData
      .map(({ x }, index) => ({
        x: x,
        y: averageValues[index],
      }));
  }, [selectedMeasurementData]);

  const filteredAverageData = averageData
    .filter((data): data is { x : number, y : number} => data.y !== null);
  const visibleAverageData = filteredAverageData.filter(({ x }) => x >= 0);
  const combinedDataValues = [...selectedVisibleData, ...visibleAverageData].map(({ y }) => y);

  let dotSize = 8;
  if (chartDuration > 400) dotSize = 1;
  else if (chartDuration > 200) dotSize = 2;
  else if (chartDuration > 80) dotSize = 4;
  else if (chartDuration > 40) dotSize = 5;
  else if (chartDuration > 20) dotSize = 6;

  const chartWidth = dimensions.window.width - 32 - 32;
  const chartPadding = 8;
  const chartHeight = 300;

  const verticalStep = step || 1;
  const verticalMinRaw = !isTime ? 0 : combinedDataValues.length ? Math.min(...combinedDataValues) : 0;
  const verticalMinSteps = Math.floor(verticalMinRaw / verticalStep);
  const verticalMinUnits = verticalMinSteps * verticalStep;
  const verticalMaxRaw = isBool ? 1 : combinedDataValues.length ? Math.max(...combinedDataValues) : 1;
  const verticalMaxSteps = Math.max(Math.ceil(verticalMaxRaw / verticalStep), verticalMinSteps + 1);
  const verticalMaxUnits = verticalMaxSteps * verticalStep;
  const verticalOffset = (verticalMaxUnits - verticalMinUnits) * (chartPadding / chartHeight);
  const verticalSteps = verticalMaxSteps - verticalMinSteps;

  const horizontalMin = 0;
  const horizontalMax = Math.max(chartDuration, 1);
  const horizontalOffset = (horizontalMax - horizontalMin) * (chartPadding / chartWidth);

  const measurementChartInputs = [id, measurements, chartDuration, measurementTrendline.value, globalPalette.primary, s, chartWidth, measurementPalette];

  const chartStats = useMemo(() => {
    const recordingCount = selectedVisibleData.length;
    const total = selectedVisibleData.reduce((acc, curr) => acc + curr.y || 0, 0);
    const totalString = !!selectedMeasurement && !isTime ? formatValue(total, isBool ? 'count' : selectedMeasurement.type, selectedMeasurement.unit, true) : '--';
    const average = recordingCount ? total / recordingCount : 0;
    const averageString = !!selectedMeasurement ? formatValue(average, isBool ? 'count' : selectedMeasurement.type, selectedMeasurement.unit, true) : '--';

    return (
      <View style={[s.chartStats, { backgroundColor: measurementPalette.backdrop }]}>
        <View style={s.chartStat}>
          <Text variant='bodyMedium'>Average</Text>
          <Text variant='titleMedium' style={{ flexGrow: 1, textAlign: 'right' }}>{averageString}</Text>
        </View>
        <View style={s.chartStat}>
          <Text variant='bodyMedium'>Total</Text>
          <Text variant='titleMedium' style={{ flexGrow: 1, textAlign: 'right' }}>{totalString}</Text>
        </View>
        <View style={s.chartStat}>
          <Text variant='bodyMedium'>Recordings</Text>
          <Text variant='titleMedium' style={{ flexGrow: 1, textAlign: 'right' }}>{recordingCount}</Text>
        </View>
      </View>
    )
  }, measurementChartInputs);

  const measurementArea = useMemo(() => {
    return selectedMeasurementData.length > 1 ? (
      <Area
        data={selectedMeasurementData}
        smoothing='cubic-spline'
        theme={{
          gradient: {
            from: {
              color: measurementPalette.primary,
              opacity: 0.25
            },
            to: {
              color: measurementPalette.primary,
              opacity: 0
            }
          }
        }}
      />
    ) : null;
  }, measurementChartInputs);

  const measurementLine = useMemo(() => {
    return selectedMeasurementData.length && dotSize ? (
      <Line
        data={selectedMeasurementData}
        theme={{
          stroke: {
            width: 0,
          },
          scatter: {
            default: {
              width: dotSize,
              height: dotSize,
              color: measurementPalette.primary,
              rx: dotSize,
            },
          }
        }}
        hideTooltipOnDragEnd
        onTooltipSelect={(_, index) => {
          triggerHaptic('selection');
          setSelectedMeasurementDataIndex(index);
        }}
        onTooltipSelectEnd={() => {
          setSelectedMeasurementDataIndex(-1);
        }}
        initialTooltipIndex={selectedMeasurementData.length - 1}
      />
    ) : null;
  }, measurementChartInputs);

  const measurementAverageLine = useMemo(() => {
    return selectedMeasurementData.length > 1 && measurementTrendline.value && filteredAverageData.length > 1 ? (
      <Line
        data={filteredAverageData}
        theme={{
          stroke: {
            color: measurementPalette.primary,
            width: 2,
            dashArray: [8, 4],
          },
          scatter: {
            default: {
              width: 0,
              height: 0,
            }
          }
        }}
      />
    ) : null
  }, measurementChartInputs);

  const chart = useMemo(() => {
    return (
      <View style={{ overflow: 'hidden' }}>
        <Chart
          xDomain={{
            min: horizontalMin - horizontalOffset,
            max: horizontalMax + horizontalOffset,
          }}
          yDomain={{
            min: verticalMinUnits - verticalOffset,
            max: verticalMaxUnits + verticalOffset,
          }}
          style={{
            height: chartHeight,
            width: chartWidth,
          }}
          padding={{
            top: 0,
            bottom: 0,
          }}
        >
          {measurementArea}
          {measurementAverageLine}
          {measurementLine}
        </Chart>
      </View>
    )
  }, measurementChartInputs);

  const chartTicks = useMemo(() => {
    const stepsPerTick = Math.ceil(verticalSteps / 5);
    const tickCount = Math.ceil(verticalSteps / stepsPerTick); 
    const ticks = range(0, tickCount)
      .map((tickIndex) => {
        const stepsFromBottom = tickIndex * stepsPerTick;
        const unitsFromBottom = stepsFromBottom * verticalStep;
        const unitsFromZero = verticalMinUnits + unitsFromBottom;
        return unitsFromZero;
      });
    return (
      <View style={s.chartTicks} pointerEvents='none'>
        {ticks.map((value) => {
          const height = 24;
          const bottom = ((value - verticalMinUnits) / (verticalMaxUnits - verticalMinUnits)) * (300 - 2 * chartPadding) + chartPadding - height / 2;
          const label = formatValue(value, type, unit, false);
          return value !== verticalMaxUnits && (
            <View key={value} style={{ ...s.chartTick, bottom, height, }}>
              <View style={{ ...s.chartTickLine, flexGrow: 0, width: 8 }} />
              <Text style={s.chartTickLabel} variant='bodyMedium'>{label}</Text>
              <View style={s.chartTickLine} />
            </View>
          )
        })}
        <View style={{ ...s.chartTick, bottom: (300 - 2 * chartPadding) + chartPadding - 24 / 2, height: 24, }}>
          <View style={{ ...s.chartTickLine, flexGrow: 0, width: 8 }} />
          <Text style={s.chartTickLabel} variant='bodyMedium'>{formatValue(verticalMaxUnits, type, unit, true)}</Text>
          <View style={s.chartTickLine} />
        </View>
      </View>
    )
  }, measurementChartInputs);

  const chartSelection = useMemo(() => {
    const selectedDateDayOffset = selectedMeasurementDataIndex === -1 ? 0 : selectedMeasurementData[selectedMeasurementDataIndex].x;
    const selectedDate = today.toDate();
    selectedDate.setDate(selectedDate.getDate() - chartDuration + selectedDateDayOffset);
    const selectedDateString = `${SimpleDate.fromDate(selectedDate).toFormattedString(true)}: `;

    const selectedDateValue = selectedMeasurementDataIndex === -1 ? null : selectedMeasurementData[selectedMeasurementDataIndex].y;
    const selectedDateValueString = formatValue(selectedDateValue, type, unit, true);
    
    const selectedDateAverage = selectedMeasurementDataIndex === -1 ? null : averageData[selectedMeasurementDataIndex]?.y;
    const selectedDateAverageString = formatValue(selectedDateAverage, type, unit, true);
    const selectedDateAverageLabel = `${measurementTrendline.title || ''}: `;

    const ratio = selectedDateDayOffset / horizontalMax;
    const justifyContent = ratio > 0.8 ? 'flex-end' : 'flex-start';
    return selectedMeasurementDataIndex < 0 ? null : (
      <View style={s.chartSelectionContainer}>
        <View
          style={[s.chartSelectionLine,
            {
              top: 27 - chartPadding,
              left: (selectedDateDayOffset / horizontalMax) * (chartWidth - 2 * chartPadding) + chartPadding - 1,
              borderColor: measurementPalette.primary || theme.colors.onSurface,
            }
          ]}
        />
        <View style={{ flexGrow: (selectedDateDayOffset / horizontalMax) }} />
        <View style={s.chartSelection}>
          <View style={{ ...s.chartSelectionRow, justifyContent }}>
            <Text style={s.chartSelectionLabel} numberOfLines={1} variant='bodyMedium'>
              {selectedDateString}
            </Text>
            <Text style={s.chartSelectionValue} numberOfLines={1} variant='titleSmall'>
              {selectedDateValueString}
            </Text>
          </View>
          {selectedDateAverageString ? (
            <View style={{ ...s.chartSelectionRow, justifyContent }}>
              <Text style={s.chartSelectionLabel} numberOfLines={1} variant='bodyMedium'>
                {selectedDateAverageLabel}
              </Text>
              <Text style={s.chartSelectionValue} numberOfLines={1} variant='titleSmall'>
                {selectedDateAverageString}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexGrow: 1 - (selectedDateDayOffset / horizontalMax) }} />
      </View>
    )
  }, [...measurementChartInputs, selectedMeasurementDataIndex]);

  const chartDurationButtons = useMemo(() => {
    return (
      <View style={{ ...s.cardRow, ...s.chartDurationButtons }}>
        {MEASUREMENT_CHART_DURATION_ITEMS.map((item) => {
          const selected = item.value === measurementChartDuration.value;
          return (
            <Button
              key={item.value}
              onPress={() => {
                setSelectedMeasurementDataIndex(-1);
                setMeasurementChartDuration(item);
              }}
              mode={'text'}
              textColor={measurementPalette.primary}
              style={s.durationButton}
              contentStyle={[s.durationButtonContent, selected ? { backgroundColor: measurementPalette.backdrop } : {}]}
              compact
            >
              <Text variant='labelLarge'>
                {item.title}
              </Text>
            </Button>
          );
        })}
      </View>
    )
  }, measurementChartInputs);

  return measurements.length === 0 ? null : (
    <View style={s.cardContainer}>
      <Text variant='titleLarge'>Measurements</Text>
      <View style={{ ...s.cardRow, gap: 16, alignItems: 'flex-start', marginTop: 8 }}>
        <View style={s.chartControls}>
          {measurementDropdown}
          {measurementTrendlineDropdown}
        </View>
        {chartStats}
      </View>
      <View style={s.cardRow}>
        <View style={{ paddingTop: 52, paddingBottom: 0 }}>
          {chart}
          {chartTicks}
          {chartSelection}
        </View>
      </View>
      {chartDurationButtons}
    </View>
  );
};

export default History;