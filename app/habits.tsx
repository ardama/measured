import Habits from '@c/Habits'
import { withAuth } from '@u/hocs/withAuth';

const HabitsScreen = () => {
  return (
    <Habits />
  )
}

export default withAuth(HabitsScreen);