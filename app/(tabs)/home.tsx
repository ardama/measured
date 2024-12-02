import Recordings from '@c/Recordings';
import { withAuth } from '@u/hocs/withAuth';

const RecordingsScreen = () => {
  return <Recordings />
};

export default withAuth(RecordingsScreen);