import Plus from '@c/Plus';
import { withUser } from '@u/hocs/withUser';

const PlusScreen = () => {
  return (
    <Plus />
  );
}

export default withUser(PlusScreen);