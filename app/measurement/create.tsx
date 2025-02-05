import Header from '@c/Header';
import MeasurementForm from '@c/MeasurementForm';
import { useMeasurements } from '@s/selectors';
import { createMeasurement } from '@t/measurements';
import { withUser } from '@u/hocs/withUser';
import { useAuth } from '@u/hooks/useAuth';

const MeasurementCreateScreen = () => {
  const auth = useAuth();
  const measurements = useMeasurements();

  let measurement = createMeasurement(auth?.user?.uid || '', '', '', '', 'minutes', 15, (measurements[measurements.length - 1]?.priority || 0) + 1)
  return (
    <>
      <MeasurementForm measurement={measurement} formType={'create'} />
    </>
  )
}

export default withUser(MeasurementCreateScreen);