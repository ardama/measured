import { StyleSheet, View, ScrollView } from 'react-native';
import { useHabits, useMeasurement, useMeasurements, useRecordings, useUser } from '@s/selectors';
import { measurementTypeData, type Measurement } from '@t/measurements';
import { Divider, Icon, IconButton, ProgressBar, Surface, Switch, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { createRecording, type Recording, type RecordingData as RecordingDataMeasurement } from '@t/recording';
import { useEffect, useMemo, useState } from 'react';
import { generateDates, SimpleDate } from '@u/dates';
import Header from '@c/Header';
import { useDispatch } from 'react-redux';
import { addRecording, editRecording, editRecordingData } from '@s/userReducer';
import type { Habit } from '@t/habits';
import { formatNumber } from '@u/helpers';


export default function HomeScreen() {
  const dispatch = useDispatch();
  const recordings = useRecordings();
  const measurements = useMeasurements();
  const habits = useHabits();
  const [dateIndex, setDateIndex] = useState(6);
  const [dates, setDates] = useState(generateDates(7, 0));
  const currentDate = dates[dateIndex];
  const weekStartDateIndex = dateIndex - currentDate.getDayOfWeek();
  const weekDates = dates.slice(weekStartDateIndex, Math.min(weekStartDateIndex + 7, dates.length));
  const user = useUser();

  const theme = useTheme();
  const styles = createStyles(theme);

  const recording = recordings.find(({ date }) => date === currentDate.toString());
  const weekRecordings = weekDates.map((weekDate) => recordings.find(({ date }) => date === weekDate.toString()));
  useEffect(() => {
    weekRecordings.forEach((weekRecording, index) => {
      const weekDateIndex = weekStartDateIndex + index;

      if (weekRecording && weekDateIndex !== dates.length - 1) return;

      const newRecordingData: RecordingDataMeasurement[] = user.measurements.map((m) => ({
        measurementId: m.id,
        value: 0,
      }));
  
      if (weekRecording) {
        let overlapCount = 0;
        newRecordingData.map((newData) => {
          const existingData = weekRecording.data.find(({ measurementId }) => measurementId === newData.measurementId);
          overlapCount += existingData ? 1 : 0;
          return existingData || newData;
        });
  
        if (overlapCount === newRecordingData.length && overlapCount === weekRecording.data.length) return;
        dispatch(editRecording({ id: weekRecording.id, updates: { ...weekRecording, data: newRecordingData }}));
      } else {
        const newRecording = createRecording(user.id, weekDates[index].toString(), newRecordingData);
        dispatch(addRecording(newRecording));
      }
    })
  }, [weekStartDateIndex, weekRecordings, weekDates, measurements]);  

  const weeklyPoints = weekRecordings.map((weeklyRecording) => {
    return habits.reduce((previous: number, current: Habit) => {
      const data = weeklyRecording?.data.find(({ measurementId }) => measurementId === current.measurementId);
      if (!data) return previous;
  
      const [complete, _] = getHabitCompletion(current, data);
      return previous + (complete ? current.points : 0);
    }, 0);
  });

  const dailyPointTotal = weeklyPoints[currentDate.getDayOfWeek()];
  const weeklyPointTotal = weeklyPoints.slice(0, currentDate.getDayOfWeek() + 1).reduce((previous: number, current: number) => previous + current, 0);

  const weeklyPointTarget = habits.reduce((previous: number, current: Habit) => {
    return previous + current.points * current.daysPerWeek;
  }, 0);


  const proratedWeeklyTarget = weeklyPointTarget * weekDates.length / 7; 
  const dailyPointTarget = weeklyPointTarget / 7;

  let dateLabel = currentDate.toFormattedString();
  if (dateIndex === dates.length - 1) dateLabel = 'Today';
  else if (dateIndex === dates.length - 2) dateLabel = 'Yesterday';
  return (
    <>
      <Header title='Home' />
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Surface style={styles.recordingHeaderContainer}>
            <View style={styles.recordingHeader}>
              {dateIndex === dates.length - 1 ? (
                <View style={styles.recordingHeaderIcon}>
                  <Icon source='calendar-today' size={26} color={theme.colors.primary} />
                </View>
              ) : null}
              <Text style={styles.recordingHeaderDate} variant='titleLarge'>
                {dateLabel}
              </Text>
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'chevron-double-left'}
                onPress={() => {
                  const nextDayIndex = dateIndex - 7;
                  if (nextDayIndex < 7) {
                    setDates([...generateDates(14, dates.length), ...dates]);
                    setDateIndex(nextDayIndex + 14);
                  } else {
                    setDateIndex(nextDayIndex);
                  }
                }}
              />
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'chevron-left'}
                onPress={() => {
                  if (dateIndex < 7) {
                    setDates([...generateDates(7, dates.length), ...dates]);
                    setDateIndex(dateIndex + 6);
                  } else {
                    setDateIndex(dateIndex - 1);
                  }
                }}
                />
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'chevron-right'}
                disabled={dateIndex >= dates.length - 1}
                onPress={() => {
                  setDateIndex(Math.min(dates.length - 1, dateIndex + 1));
                }}
              />
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'chevron-double-right'}
                disabled={dateIndex >= dates.length - 1}
                onPress={() => {
                  setDateIndex(Math.min(dates.length - 1, dateIndex + 7));
                }}
              />
              <IconButton
                style={styles.recordingHeaderButton}
                icon={'page-last'}
                disabled={dateIndex >= dates.length - 1}
                onPress={() => {
                  setDateIndex(dates.length - 1);
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
                  <Text style={{ ...styles.weekdayText, ...(index === currentDate.getDayOfWeek() ? styles.weekdayTextToday : {})}} variant='titleSmall'>{day}</Text>
                  {currentDate.getDayOfWeek() === index && <View style={styles.weekProgressMarker} />}
                </View>
              ))}
              <View>
                <ProgressBar
                  progress={weeklyPointTotal / weeklyPointTarget}
                  style={styles.weekdayProgress}
                  color={theme.colors.primary}
                />
              </View>
            </View>
            <View style={styles.weekPointsContainer}>
              <Text style={styles.weekPointsTotal}>{weeklyPointTotal}</Text>
              <View style={styles.weekPointsIcon}>
                <Icon source='star-four-points' size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.weekPointsDivider}> / </Text>
              <Text style={styles.weekPointsTarget}>{weeklyPointTarget}</Text>
            </View>
          </View>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.recordingContainer}>
            <View style={styles.recordingContainerHeader}>
              <View style={styles.recordingContainerHeaderIcon}>
                <Icon source='clipboard-edit-outline' size={20} />
              </View>
              <Text style={styles.recordingTitle} variant='titleSmall'>Measurements</Text>
            </View>
            {
              recording && (
                <ScrollView style={styles.recordingScrollview}>
                    {
                      recording.data.map((data) => {
                        const measurement = measurements.find(({ id }) => id === data.measurementId );
                        if (!measurement) return null;
                        return (
                          <RecordingDataMeasurement
                            key={data.measurementId}
                            data={data}
                            measurement={measurement}
                            onPlus={() => {
                              const value = data.value + measurement.step;
                              const nextRecordingData = { ...data, value };
                              dispatch(editRecordingData({ id: recording.id, measurementId: measurement.id, updates: nextRecordingData }));
                            }}
                            onMinus={() => {
                              const value = Math.max(0, data.value - measurement.step);
                              const nextRecordingData = { ...data, value };
                              dispatch(editRecordingData({ id: recording.id, measurementId: measurement.id, updates: nextRecordingData }));                        
                            }}
                            onToggle={(toggled) => {
                              const nextRecordingData = { ...data, value: toggled ? 1 : 0};
                              dispatch(editRecordingData({ id: recording.id, measurementId: measurement.id, updates: nextRecordingData }));                        
                            }}
                          />
                        );
                      })
                    }
                </ScrollView>
              )
            }
          </View>
          <View style={styles.recordingContainer}>
            <View style={styles.recordingContainerHeader}>
              <View style={styles.recordingContainerHeaderIcon}>
                <Icon source='checkbox-multiple-outline' size={20} />
              </View>
              <Text style={styles.recordingTitle} variant='titleSmall'>Habits</Text>
            </View>
            <ScrollView style={styles.recordingScrollview}>
              {
                habits.map((habit) => {
                  const data = recording?.data.find(({ measurementId }) => measurementId === habit.measurementId);
                  if (!data) return null;

                  return (
                    <RecordingDataHabit
                      key={habit.id}
                      data={data}
                      habit={habit}
                    />
                  );
                })
              }
            </ScrollView>
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
    paddingHorizontal: 8
  },
  recordingHeaderDate: {
    flex: 1,
    marginTop: 12,
    paddingLeft: 12,
    color: theme.colors.primary,
  },
  recordingHeaderIcon: {
    marginTop: 14,
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
    height: 60,
  },
  weekday: {
    position: 'absolute',
    top: 30,
    width: 32,
    height: 32,
    lineHeight: 32,
    textAlign: 'center',
    marginLeft: -16,
    borderRadius: 16,
  },
  weekdayText: {
    textAlign: 'center',
    color: theme.colors.outlineVariant,
  },
  weekdayTextToday: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  weekProgressContainer: {
    flex: 1,
  },
  weekdayProgress: {
    height: 12,
    borderRadius: 6,
    flexGrow: 0,
    marginTop: 12,
    marginBottom: 4,
  },
  weekProgressMarker: {
    top: 20,
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
  },
  weekPointsTotal: {
    width: 30,
    textAlign: 'right',
    fontWeight: 'bold',
    lineHeight: 24,
    fontSize: 16,
    color: theme.colors.primary,
  },
  weekPointsDivider: {
    marginHorizontal: 1,
    lineHeight: 24,
    fontSize: 16,
    color: theme.colors.outline,
  },
  weekPointsTarget: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.outline,
  },
  weekPointsIcon: {
    marginTop: 4,
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  recordingContainer: {
    marginVertical: 16,
  },
  recordingContainerHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recordingContainerHeaderIcon: {
    marginTop: 3,
    marginRight: 6,
  },
  recordingTitle: {
    borderRadius: 16,
    fontSize: 20,
    lineHeight: 24,
  },
  recordingScrollview: {
    
  },
  recordingDivider: {
    marginVertical: 24,
  },
});


const RecordingDataMeasurement = ({ data, measurement, onPlus, onMinus, onToggle } : { data: RecordingDataMeasurement, measurement: Measurement, onPlus: (() => void) | undefined, onMinus: (() => void) | undefined, onToggle: ((toggled: boolean) => void) | undefined }) : JSX.Element | null  => {
  const theme = useTheme();
  const typeData = measurementTypeData.find((data) => data.type === measurement.type);
  if (!typeData) return null;

  return (
    <>
      <View style={measurementStyles.container}>
        <View style={measurementStyles.typeIconContainer}>
          <Icon source={typeData.icon} size={24} />
        </View>
        <View style={measurementStyles.labelContainer}>
          <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={measurementStyles.labelActivity}>{measurement.activity}</Text>
          {measurement.variant ? (
            <>
              <Text variant='bodyLarge' style={measurementStyles.labelDivider}> : </Text>
              <Text numberOfLines={1} ellipsizeMode="tail" variant='bodyLarge' style={[measurementStyles.labelVariant, { color: theme.colors.outline }]}>{measurement.variant}</Text>
            </>
          ) : null}
        </View>
        <View style={measurementStyles.controlContainer}>
          {
            measurement.type !== 'bool' && (
              <>
                <Text style={measurementStyles.value} variant='titleMedium'>{formatNumber(data.value)}</Text>
                {measurement.unit && <Text style={measurementStyles.valueLabel} variant='bodyLarge'>{measurement.unit}</Text>}
                <IconButton size={18} icon='plus' onPress={() => {
                  onPlus && onPlus();
                }}/>
                <IconButton size={18} icon='minus' disabled={!data.value} onPress={() => {
                  onMinus && onMinus();
                }}/>
              </>
            )
          }
          {
            measurement.type === 'bool' && (
              <>
                <Text style={measurementStyles.value} variant='titleMedium'> </Text>
                <IconButton size={18} mode={data.value ? 'contained' : undefined} icon='check' onPress={() => {
                  onToggle && onToggle(true);
                }}/>
                <IconButton size={18} mode={!data.value ? 'contained' : undefined} icon='window-close' onPress={() => {
                  onToggle && onToggle(false);
                }}/>
              </>
            )
          }
        </View>
      </View>
    </>
  );
}

const measurementStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    marginBottom: 4,
  },
  typeIconContainer: {
    paddingVertical: 12, 
    marginRight: 12,
  },
  typeIcon: {
    
  },
  labelContainer: {
    marginTop: 12,
    flexDirection: 'row',
    marginRight: 24,
    flexShrink: 1,
  },
  labelActivity: {
    flexShrink: 1,
  },  
  labelDivider: {
    marginHorizontal: 1,
    flexShrink: 0,
  },
  labelVariant: {
    flexShrink: 0,
  },
  controlContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 0,
    paddingVertical: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    marginTop: 11,
    marginRight: 6,
  },
  valueLabel: {
    textAlign: 'right',
    marginTop: 11,
    marginRight: 6,
  },
});

const RecordingDataHabit = ({ data, habit } : { data: RecordingDataMeasurement, habit: Habit }) : JSX.Element | null => {
  const theme = useTheme();
  const habitStyles = createHabitStyles(theme);
  const measurement = useMeasurement(habit.measurementId);
  const typeData = measurementTypeData.find((data) => data.type === measurement?.type);
  if (!typeData) return null;

  const [complete, progress] = getHabitCompletion(habit, data);


  return (
    <>
      <View style={habitStyles.container}>
        <View style={habitStyles.labelContainer}>
          <Text variant='titleMedium'>{habit.name}</Text>
          <View style={habitStyles.labelSubtitle}>
            <View style={habitStyles.labelSubtitleIcon}>
              <Icon source={typeData.icon} size={18} />
            </View>
            <Text numberOfLines={1} ellipsizeMode="tail" style={habitStyles.labelSubtitleActivity} variant='bodyMedium'>{measurement?.activity}</Text>
            {measurement?.variant ? (
              <>
                <Text style={habitStyles.labelSubtitleDivider} variant='bodyMedium'> : </Text>
                <Text numberOfLines={1} ellipsizeMode="tail" style={habitStyles.labelSubtitleVariant} variant='bodyMedium'>{measurement?.variant}</Text>
              </>
            ) : null}
          </View>
        </View>
        {measurement?.type !== 'bool' ? (
          <View style={habitStyles.progressContainer}>
            <View>
              <ProgressBar
                style={habitStyles.progress}
                progress={progress}
                color={complete ? theme.colors.primary : theme.colors.outlineVariant}
              />
            </View>
            <View style={habitStyles.progressLabel}>
              <Text style={habitStyles.progressLabelCurrent} variant='bodyMedium'>{formatNumber(data.value)}</Text>
              <Text style={habitStyles.progressLabelDivider} variant='bodyMedium'> / </Text>
              <Text numberOfLines={1} style={habitStyles.progressLabelTarget} variant='bodyMedium'>
                {formatNumber(habit.daily)}{measurement?.unit ? ` ${ measurement?.unit}` : ''}
              </Text>
            </View>
          </View>
        ) : null}
        <View style={[habitStyles.points, (complete ? habitStyles.pointsComplete : null)]}>
          <Text style={habitStyles.pointsText} variant='titleSmall'>{habit.points}</Text>
          <View style={habitStyles.pointsIcon}>
            <Icon source={`star-four-points`} size={14} color={theme.colors.onPrimary} />
          </View>
        </View>
      </View>
    </>
  );
}

const createHabitStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  typeIconContainer: {
    // height: 64,
    // paddingVertical: 18, 
    // marginRight: 12,
  },
  typeIcon: {
    
  },
  labelContainer: {
    flex: 1,
    marginTop: 6,
  },
  labelSubtitle: {
    flexDirection: 'row',
  },
  labelSubtitleIcon: {
    marginTop: 1,
    marginRight: 4,
  },
  labelSubtitleActivity: {
    flexGrow: 0,
    flexShrink: 1,
  },
  labelSubtitleDivider: {
    marginHorizontal: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  labelSubtitleVariant: {
    color: theme.colors.outline,
    flexShrink: 0,
  },
  progressContainer: {
    width: '30%',
    flexGrow: 0,
    flexDirection: 'column',
    marginLeft: 8,
  },
  progress: {
    height: 12,
    borderRadius: 6,
    flexGrow: 0,
    marginTop: 12,
    marginBottom: 8,
  },
  progressLabel: {
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 4,
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
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
  points: {
    backgroundColor: theme.colors.outlineVariant,
    width: 44,
    height: 28,
    flexDirection: 'row',
    marginTop: 18,
    marginLeft: 12,
    marginRight: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsComplete: {
    backgroundColor: theme.colors.primary,
  },
  pointsText: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.onPrimary,
    marginRight: 2,
  },
  pointsIcon: {
    marginTop: 3,
  },
});

const getHabitCompletion = (habit: Habit, data: RecordingDataMeasurement): [boolean, number] => {
  let progress = 0;
  let complete = false;
  switch (habit.operator) {
    case '>':
      progress = Math.min(data.value / habit.daily, 1.0) || 0;
      complete = data.value > habit.daily;
      break;
    case '>=':
      progress = Math.min(data.value / habit.daily, 1.0) || 0;
      complete = data.value >= habit.daily;
      break;
    case '<':
      progress = Math.min(data.value / habit.daily, 1.0) || 0;
      complete = data.value < habit.daily;
      break;
    case '<=':
      if (habit.daily === 0 && data.value === 0) {
        progress = 1;
        complete = true;
        break;
      }
      progress = Math.min(data.value / habit.daily, 1.0) || 0;
      complete = data.value <= habit.daily;
      break;
    case '==':
      if (habit.daily === 0 && data.value === 0) {
        progress = 1;
        complete = true;
        break;
      }
      progress = Math.min(data.value / habit.daily, 1.0) || 0;
      complete = data.value === habit.daily;
      break;
    case '!=':
      progress = Math.min(data.value / habit.daily, 1.0) || 0;
      complete = data.value !== habit.daily;
      break;
  }
  return [complete, progress];
}