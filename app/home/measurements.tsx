import Measurements from '@c/Measurements'
import { withAuth } from '@u/hocs/withAuth';

const MeasurementsScreen = () => {
  return (
    <Measurements />
  )
}

export default withAuth(MeasurementsScreen);