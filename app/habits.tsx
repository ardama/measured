import Habits from '@c/Habits'
import { withUser } from '@u/hocs/withUser';

const HabitsScreen = () => {
  return (
    <Habits />
  )
}

export default withUser(HabitsScreen);