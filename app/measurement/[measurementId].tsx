import MeasurementForm from '@c/MeasurementForm';
import { useMeasurement } from '@s/selectors';
import { router, useLocalSearchParams } from 'expo-router';

const MeasurementEditScreen = () => {
  const { measurementId } = useLocalSearchParams();
  const parsedId = Array.isArray(measurementId) ? measurementId.join('') : measurementId;
  const measurement = useMeasurement(parsedId);

  if (!measurement) {
    router.canGoBack() ? router.back() : router.replace('/');
    return null;
  }
  return (
    <MeasurementForm measurement={measurement} formType={'edit'} />
  )
}

export default MeasurementEditScreen;