import { generateId } from '@u/helpers';

interface Recording {
  id: string,
  userId: string,
  date: string,
  data: RecordingData[],
  submitted: boolean,
}

const createRecording = (userId: string, date: string, data: RecordingData[] = []): Recording => ({
  id: generateId(),
  userId,
  date,
  data,
  submitted: false,
});

interface RecordingData {
  measurementId: string,
  value: number;
}

const createRecordingData = (measurementId: string, value: number): RecordingData => ({
  measurementId,
  value,
});

export {
  type Recording,
  createRecording,

  type RecordingData,
  createRecordingData,
}