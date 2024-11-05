import Header from '@c/Header';
import MeasurementForm from '@c/MeasurementForm';
import { useMeasurement } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { router, useLocalSearchParams } from 'expo-router';

const MeasurementEditScreen = () => {
  const { measurementId } = useLocalSearchParams();
  const parsedId = Array.isArray(measurementId) ? measurementId.join('') : measurementId;
  const measurement = useMeasurement(parsedId);

  if (!measurement) {
    setTimeout(() => {
      router.canGoBack() ? router.back() : router.replace('/');
    }, 0);
    return null;
  }

  return (
    <>
      <MeasurementForm measurement={measurement} formType={'edit'} />
    </>
  )
}

export default withAuth(MeasurementEditScreen);