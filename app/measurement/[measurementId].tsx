import Header from '@c/Header';
import LoadingScreen from '@c/Loading';
import MeasurementForm from '@c/MeasurementForm';
import { useMeasurement } from '@s/selectors';
import { withAuth } from '@u/hocs/withAuth';
import { useAuth } from '@u/hooks/useAuth';
import { router, useLocalSearchParams } from 'expo-router';

const MeasurementEditScreen = () => {
  const { measurementId } = useLocalSearchParams();
  const parsedId = Array.isArray(measurementId) ? measurementId.join('') : measurementId;
  const measurement = useMeasurement(parsedId);

  const { loading, initialAuthCheckComplete } = useAuth();

  if (!measurement) {
    setTimeout(() => {
      router.canGoBack() ? router.back() : router.replace('/');
    }, 250);
  }

  return (
    <>
      {measurement && <MeasurementForm measurement={measurement} formType={'edit'} />}
      <LoadingScreen visible={!measurement || loading || !initialAuthCheckComplete} />
    </>
  )
}

export default withAuth(MeasurementEditScreen);