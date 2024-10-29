import Header from '@c/Header';
import MeasurementForm from '@c/MeasurementForm';
import { useMeasurements } from '@s/selectors';
import { createMeasurement } from '@t/measurements';
import { withAuth } from '@u/hocs/withAuth';
import { useAuth } from '@u/hooks/useAuth';

const MeasurementCreateScreen = () => {
  const auth = useAuth();
  const measurements = useMeasurements();

  let measurement = createMeasurement(auth?.user?.uid || '', '', '', '', 'minutes', 15, (measurements[measurements.length - 1]?.priority || 0) + 1)
  return (
    <>
      <Header showBackButton title={'Create measurement'} />
      <MeasurementForm measurement={measurement} formType={'create'} />
    </>
  )
}

export default withAuth(MeasurementCreateScreen);