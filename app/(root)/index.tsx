import { StyleSheet, View, ScrollView } from 'react-native';
import { useMeasurements, useRecordings, useUser } from '@s/selectors';
import { measurementTypeData, type Measurement } from '@t/measurements';
import { Divider, Icon, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { createRecording, type Recording, type RecordingData } from '@t/recording';
import { useEffect, useMemo, useState } from 'react';
import { generateDates, SimpleDate } from '@u/dates';
import Header from '@c/Header';
import { useDispatch } from 'react-redux';
import { addRecording, editRecording, editRecordingData } from '@s/userReducer';


export default function HomeScreen() {
  const dispatch = useDispatch();
  const recordings = useRecordings();
  const measurements = useMeasurements();
  const [dateIndex, setDateIndex] = useState(0);
  const [dates, setDates] = useState(generateDates(7, 0));
  const currentDate = dates[dateIndex];
  const user = useUser();

  const theme = useTheme();

  const recording = recordings.find(({ date }) => date === currentDate.toString());
  useEffect(() => {
    if (recording) return;
    console.log(`creating for ${currentDate.toString()}`)
    const newRecordingData: RecordingData[] = user.measurements.map((m) => ({
      measurementId: m.id,
      value: 0,
    }));
    const newRecording = createRecording(user.id, currentDate.toString(), newRecordingData);
    dispatch(addRecording(newRecording));
  }, [recording]);

  console.log(`found for ${currentDate.toString()}`)

  return (
    <>
      <Header title='Home' />
      <View style={styles.container}>
        <Surface style={styles.recordingContainer}>
          <View style={styles.recordingHeader}>
            <IconButton
              style={styles.recordingHeaderButton}
              icon={'page-first'}
              disabled={dateIndex <= 0}
              onPress={() => {
                const nextDayIndex = Math.max(0, dateIndex - currentDate.getDaysInMonth());
                setDateIndex(nextDayIndex);
              }}
            />
            <IconButton
              style={styles.recordingHeaderButton}
              icon={'chevron-left'}
              disabled={dateIndex <= 0}
              onPress={() => {
                if (dateIndex === 0) return;
                setDateIndex(dateIndex - 1);
              }}
            />
            <Text style={[styles.recordingHeaderTitle, { color: theme.colors.primary }]} variant='titleLarge'>
              {currentDate.toFormattedString()}
            </Text>
            <IconButton
              style={styles.recordingHeaderButton}
              icon={'chevron-right'}
              onPress={() => {
                if (dateIndex >= dates.length - 1) {
                  setDates([...dates, ...generateDates(7, dates.length)]);
                };
                setDateIndex(dateIndex + 1);
              }}
              />
            <IconButton
              style={styles.recordingHeaderButton}
              icon={'page-last'}
              onPress={() => {
                const days = currentDate.getDaysInPreviousMonth();
                const nextDayIndex = dateIndex + days;
                if (nextDayIndex >= dates.length) {
                  setDates([...dates, ...generateDates(nextDayIndex, dates.length)]);
                }
                setDateIndex(nextDayIndex);
              }}
            />
          </View>
        </Surface>
        <Surface style={styles.recordingContainer}>
          {
            recording && (
              <ScrollView style={styles.recordingScrollview}>
                  {
                    recording.data.map((data, index) => {
                      const measurement = measurements.find(({ id }) => id === data.measurementId );
                      if (!measurement) return <></>;
                      return (
                        <RecordingData
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
                          showDivider={index != recording.data.length - 1}
                        />
                      );
                    })
                  }
              </ScrollView>
            )
          }
        </Surface>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  recordingHeader: {
    flexDirection: 'row',
  },
  recordingHeaderTitle: {
    flex: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  recordingHeaderButton: {
  },
  recordingContainer: {
    borderRadius: 16,
    marginBottom: 16,
  },
  recordingScrollview: {
    
  },
});


const RecordingData = ({ data, measurement, onPlus, onMinus, showDivider } : { data: RecordingData, measurement: Measurement, onPlus: () => void, onMinus: () => void, showDivider: boolean }) : JSX.Element  => {
  const typeData = measurementTypeData.find((data) => data.type === measurement.type);
  if (!typeData) return <></>;

  return (
    <>
      <View key={measurement.id} style={measurementStyles.container}>
        <View style={measurementStyles.typeIconContainer}>
          <Icon source={typeData.icon} size={28} />
        </View>
        <View style={measurementStyles.labelContainer}>
          <Text variant='titleMedium'>{measurement.activity}</Text>
          <Text variant='bodyLarge'>{measurement.variant}</Text>
        </View>
        <View style={measurementStyles.controlContainer}>
          <Text style={measurementStyles.value} variant='titleLarge'>{data.value}</Text>
          <IconButton mode='contained' icon='plus' onPress={() => {
            onPlus();
          }}/>
          <IconButton mode='contained' icon='minus' onPress={() => {
            onMinus();
          }}/>
        </View>
      </View>
      {showDivider && <Divider horizontalInset />}
    </>
  );
}

const measurementStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
  },
  typeIconContainer: {
    height: 64,
    paddingVertical: 18, 
    paddingHorizontal: 16, 
  },
  typeIcon: {
    
  },
  labelContainer: {
    marginTop: 8
  },
  activity: {
    
  },
  variant: {
    
  },
  controlContainer: {
    flexDirection: 'row',
    flex: 1,
    height: 64,
    paddingVertical: 6,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    marginTop: 12,
    marginRight: 12,
  },
});