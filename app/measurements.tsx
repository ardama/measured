import Measurements from '@c/Measurements'
import { withUser } from '@u/hocs/withUser';

const MeasurementsScreen = () => {
  return (
    <Measurements />
  )
}

export default withUser(MeasurementsScreen);