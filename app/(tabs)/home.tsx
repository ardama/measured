import Recordings from '@c/Recordings';
import { withUser } from '@u/hocs/withUser';

const RecordingsScreen = () => {
  return <Recordings />
};

export default withUser(RecordingsScreen);