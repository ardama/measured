import { TabScreen, Tabs, TabsProvider } from 'react-native-paper-tabs';

import Habits from '@c/Habits';
import Measurements from '@c/Measurements';
import Header from '@c/Header';

const ConfigurationScreen = () => {
  return (
    <>
      <Header title='Configuration' />
      <TabsProvider defaultIndex={1}>
        <Tabs showTextLabel iconPosition='top'>
          <TabScreen label='Measurements' icon='clipboard-edit-outline'>
            <Measurements />
          </TabScreen>
          <TabScreen label='Habits' icon='checkbox-multiple-outline'>
            <Habits />
          </TabScreen>
        </Tabs>
      </TabsProvider>
    </>
  );
}

export default ConfigurationScreen;
