import { StyleSheet, View, ScrollView } from 'react-native';
import { useHabits, useMeasurement, useMeasurements, useRecordings, useUser } from '@s/selectors';
import { measurementTypeData, type Measurement } from '@t/measurements';
import { Checkbox, Icon, IconButton, ProgressBar, SegmentedButtons, Surface, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { createRecording, type RecordingData as RecordingDataMeasurement } from '@t/recording';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  
      const [complete, _] = getHabitCompletion(current, data.value);
      return previous + (complete ? current.points : 0);
    }, 0);
  });

  const dailyPointTotal = weeklyPoints[currentDate.getDayOfWeek()];
  const weeklyPointTotal = weeklyPoints.slice(0, currentDate.getDayOfWeek() + 1).reduce((previous: number, current: number) => previous + current, 0);

  const weeklyPointTarget = habits.reduce((previous: number, current: Habit) => {
    return previous + current.points * (current.isWeekly ? 1 : current.daysPerWeek);
  }, 0);


  const proratedWeeklyTarget = weeklyPointTarget * weekDates.length / 7; 
  const dailyPointTarget = weeklyPointTarget / 7;

  const weeklyMeasurementRecordings = new Map<string, number[]>();
  weekRecordings.forEach((weeklyRecording, index) => {
    weeklyRecording?.data.forEach(({ measurementId, value }) => {
      const current = weeklyMeasurementRecordings.get(measurementId) || [0, 0, 0, 0, 0, 0, 0];
      current[index] = value;
      weeklyMeasurementRecordings.set(measurementId, current);
    })
  })

  let dateLabel = currentDate.toFormattedString();
  if (dateIndex === dates.length - 1) dateLabel = 'Today';
  else if (dateIndex === dates.length - 2) dateLabel = 'Yesterday';

  const measurementScopes = ['Day','Week'];
  const [measurementScope, setMeasurementScope] = useState(0);

  const habitScopes = ['Day','Week'];
  const [habitScope, setHabitScope] = useState(0);

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
              <Text style={styles.weekPointsDivider}> / </Text>
              <Text style={styles.weekPointsTarget}>{weeklyPointTarget}</Text>
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
            {
              recording && (
                <View style={styles.recordingView}>
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
                            scope={measurementScopes[measurementScope].toLowerCase()}
                            weeklyData={weeklyMeasurementRecordings.get(data.measurementId) || []}
                          />
                        );
                      })
                    }
                </View>
              )
            }
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
            <View style={{ ...styles.recordingView, marginBottom: 56 }}>
              {
                habits.map((habit) => {
                  const data = recording?.data.find(({ measurementId }) => measurementId === habit.measurementId);
                  if (!data) return null;

                  return (
                    <RecordingDataHabit
                      key={habit.id}
                      data={data}
                      habit={habit}
                      scope={habitScopes[habitScope].toLowerCase()}
                      currentDate={currentDate}
                      weeklyData={(weeklyMeasurementRecordings.get(data.measurementId) || []).slice(0, weekDates.length)}
                    />
                  );
                })
              }
            </View>
          </View>
        </ScrollView>
        {/* <View style={styles.scopeButtonsContainer}>
          <Surface style={styles.scopeButtonsWrapper}>
            <SegmentedButtons
              style={styles.scopeButtons}
              value={viewScope}
              onValueChange={(value) => setViewScope(value)}
              buttons={[
                {
                  value: 'day',
                  label: 'Day',
                  icon: 'calendar-today',
                  style: styles.scopeButton,
                  labelStyle: styles.scopeButtonLabel,
                },
                {
                  value: 'week',
                  label: 'Week',
                  icon: 'calendar-week',
                  style: styles.scopeButton,
                  labelStyle: styles.scopeButtonLabel,
                }
              ]}
            />
          </Surface>
        </View> */}
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
  },
  weekPointsTotal: {
    width: 28,
    height: 28,
    lineHeight: 28,
    backgroundColor: theme.colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
    borderRadius: 100,
    marginLeft: 6,
    marginRight: 2,
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
    height: 56,
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
    width: 48,
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
});

type RecordingDataMeasurementProps = {
  data: RecordingDataMeasurement,
  measurement: Measurement,
  onPlus: (() => void) | undefined, onMinus: (() => void) | undefined,
  onToggle: ((toggled: boolean) => void) | undefined,
  weeklyData: number[],
  scope: string,
}

const RecordingDataMeasurement = ({ data, measurement, onPlus, onMinus, onToggle, weeklyData, scope } : RecordingDataMeasurementProps) : JSX.Element | null  => {
  const theme = useTheme();
  const typeData = measurementTypeData.find((data) => data.type === measurement.type);
  if (!typeData) return null;

  let controlContent;
  if (scope === 'week') {
    controlContent = (<>
      <Text style={measurementStyles.value} variant='titleMedium'>{weeklyData.reduce((acc, curr) => acc + curr, 0)}</Text>
      {measurement.unit && <Text style={measurementStyles.valueLabel} variant='bodyLarge'>{measurement.unit}</Text>}
      {measurement.type === 'bool' && (
        <View>
          <Icon source='check' size={18} />
        </View>
      )}
    </>);
  } else if (measurement.type === 'bool') {
    controlContent = (<>
      <Text style={measurementStyles.value} variant='titleMedium'> </Text>
      <IconButton size={18} mode={!data.value ? 'contained' : undefined} icon='window-close' onPress={() => {
        onToggle && onToggle(false);
      }}/>
      <IconButton size={18} mode={data.value ? 'contained' : undefined} icon='check' onPress={() => {
        onToggle && onToggle(true);
      }}/>
    </>);
  } else {
    controlContent = (<>
      <Text style={measurementStyles.value} variant='titleMedium'>{formatNumber(data.value)}</Text>
      {measurement.unit && <Text style={measurementStyles.valueLabel} variant='bodyLarge'>{measurement.unit}</Text>}
      <IconButton size={18} icon='minus' disabled={!data.value} onPress={() => {
        onMinus && onMinus();
      }}/>
      <IconButton size={18} icon='plus' onPress={() => {
        onPlus && onPlus();
      }}/>
    </>)
  }
  return (
    <>
      <View style={measurementStyles.container}>
        <View style={measurementStyles.typeIconContainer}>
          <Icon source={typeData.icon} size={24} />
        </View>
          <Text numberOfLines={1} ellipsizeMode="tail" variant='titleMedium' style={measurementStyles.labelActivity}>{measurement.activity}</Text>
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
  value: {
    flexGrow: 1,
    marginRight: 6,
    textAlign: 'right',
  },
  valueLabel: {
    textAlign: 'right',
  },
});

type RecordingDataHabitProps = {
  data: RecordingDataMeasurement,
  habit: Habit,
  weeklyData: number[],
  scope: string,
  currentDate: SimpleDate,
}

const RecordingDataHabit = ({ data, habit, weeklyData, scope, currentDate } : RecordingDataHabitProps) : JSX.Element | null => {
  const theme = useTheme();
  const habitStyles = createHabitStyles(theme);
  const measurement = useMeasurement(habit.measurementId);
  const typeData = measurementTypeData.find((data) => data.type === measurement?.type);
  if (!typeData) return null;

  
  let content;
  // if (scope === 'week' && habit.isWeekly) {
  //   const value = weeklyData.reduce((acc, curr) => acc + curr, 0);
  //   const [complete, _] = getHabitCompletion(habit, value || 0);

  //   let color = theme.colors.primary;
  //   let status = 'indeterminate';
  //   if (value === undefined) {
  //     color = theme.colors.outline;
  //   }
  //   else if (complete) {
  //     status = 'checked';
  //   }
  
  //   content = (
  //     <View style={habitStyles.checkboxContainer}>
  //       <View
  //         style={habitStyles.checkbox}>
  //         <Checkbox.IOS
  //           status={status as ('unchecked' | 'indeterminate' | 'checked')}
  //           color={color}
  //           pointerEvents='none'
  //         />
  //       </View>
  //     </View>
  //   );
  // } else
  if (scope === 'week') {
    content = (
      <View style={habitStyles.checkboxContainer}>
        {[undefined, undefined, undefined, undefined, undefined, undefined, undefined].map((_, index) => {
          const value = habit.isWeekly ? weeklyData.reduce((acc, curr) => acc + curr, 0) : weeklyData[index];
          const [complete, __] = getHabitCompletion(habit, value || 0);

          let status = 'indeterminate';
          let color = theme.colors.surfaceVariant;
          if (habit.isWeekly && index !== currentDate.getDayOfWeek()) {
            status = 'unchecked';
          } else if (value === undefined) {
            status = 'indeterminate';
          } else if (complete) {
            color = index === currentDate.getDayOfWeek() ? theme.colors.primary : theme.colors.outlineVariant;
            status = 'checked';
          } else if (index === currentDate.getDayOfWeek()) {
            color = theme.colors.primary;
          }
          return (
            <View
              key={index}
              style={habitStyles.checkbox}>
              <Checkbox.IOS
                status={status as ('unchecked' | 'indeterminate' | 'checked')}
                color={color}
                pointerEvents='none'
              />
            </View>
          );
        })}
      </View>
    );
  } else {
    const [complete, progress] = getHabitCompletion(habit, data.value);
    content = (<>
      <View style={habitStyles.progressContainer}>
        <View style={habitStyles.progressBarContainer}>
          <ProgressBar
            style={habitStyles.progressBar}
            progress={progress}
            color={complete ? theme.colors.primary : theme.colors.outlineVariant}
            />
        </View>
        <View style={habitStyles.progressLabel}>
          {typeData.type === 'bool' ? (
            <View style={{ marginTop: 2 }}>
              <Icon source={data.value ? 'check' : 'window-close'} size={16} />
            </View>
          ) : (
            <Text style={habitStyles.progressLabelCurrent} variant='bodyMedium'>
              {formatNumber(data.value)}
            </Text>
          )}
          <Text style={habitStyles.progressLabelDivider} variant='bodyMedium'>
            {' / '}
          </Text>
          {typeData.type === 'bool' ? (
            <View style={{ marginTop: 2 }}>
              <Icon source='check' size={16} />
            </View>
          ) : (
            <Text numberOfLines={1} style={habitStyles.progressLabelTarget} variant='bodyMedium'>
              {formatNumber(habit.target)}{measurement?.unit ? ` ${ measurement?.unit}` : ''}
            </Text>
          )}
        </View>
      </View>
      <View style={[habitStyles.points, (complete ? habitStyles.pointsComplete : null)]}>
        <Text style={habitStyles.pointsText} variant='titleSmall'>{habit.points}</Text>
      </View>
    </>);
  }
  return (
    <>
      <View style={habitStyles.container}>
        <View style={habitStyles.icon}>
          <Icon source={habit.isWeekly ? 'calendar-sync' : 'sync'} size={24} />
       </View>
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
        {content}
      </View>
    </>
  );
}

const createHabitStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  icon: {
    marginRight: 12,
  },
  typeIconContainer: {
  },
  typeIcon: {
    
  },
  labelContainer: {
    flex: 1,
  },
  labelSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
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
  progressContainer: {
    width: '30%',
    flexGrow: 0,
    flexDirection: 'column',
    marginLeft: 8,
  },
  progressBarContainer: {
    paddingVertical: 6,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  progressLabel: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
    width: 28,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderRadius: 100,
  },
  pointsComplete: {
    backgroundColor: theme.colors.primary,
  },
  pointsText: {
    color: theme.colors.onPrimary,
  },
  pointsIcon: {
  },
  checkboxContainer: {
    flexDirection: 'row',
  },
  checkbox: {
  },
});

const getHabitCompletion = (habit: Habit, value: number): [boolean, number] => {
  let progress = 0;
  let complete = false;
  switch (habit.operator) {
    case '>':
      progress = Math.min(value / habit.target, 1.0) || 0;
      complete = value > habit.target;
      break;
    case '>=':
      progress = Math.min(value / habit.target, 1.0) || 0;
      complete = value >= habit.target;
      break;
    case '<':
      progress = Math.min(value / habit.target, 1.0) || 0;
      complete = value < habit.target;
      break;
    case '<=':
      if (habit.target === 0 && value === 0) {
        progress = 1;
        complete = true;
        break;
      }
      progress = Math.min(value / habit.target, 1.0) || 0;
      complete = value <= habit.target;
      break;
    case '==':
      if (habit.target === 0 && value === 0) {
        progress = 1;
        complete = true;
        break;
      }
      progress = Math.min(value / habit.target, 1.0) || 0;
      complete = value === habit.target;
      break;
    case '!=':
      progress = Math.min(value / habit.target, 1.0) || 0;
      complete = value !== habit.target;
      break;
  }
  return [complete, progress];
}