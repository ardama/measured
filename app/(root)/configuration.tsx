import { TabScreen, Tabs, TabsProvider } from 'react-native-paper-tabs';

import Habits from '@c/Habits';
import Measurements from '@c/Measurements';
import Header from '@c/Header';
import { SegmentedButtons, Surface, useTheme, type MD3Theme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

const ConfigurationScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [configurationView, setConfigurationView] = useState('measurements'); 
  return (
    <>
      <Header title='Configuration' />
      <TabsProvider defaultIndex={1}>
        <Tabs showTextLabel iconPosition='top'>
          <TabScreen label='Measurements' icon='clipboard-edit-outline'>
            <Measurements />
          </TabScreen>
          <TabScreen label='Habits' icon='checkbox-multiple-marked-outline'>
            <Habits />
          </TabScreen>
        </Tabs>
      </TabsProvider>
      {/* <View style={styles.container}>
        {configurationView === 'measurements' ? (
          <Measurements />
        ) : (
          <Habits />
        )}
        <View style={styles.scopeButtonsContainer}>
          <Surface style={styles.scopeButtonsWrapper}>
            <SegmentedButtons
              style={styles.scopeButtons}
              value={configurationView}
              onValueChange={(value) => setConfigurationView(value)}
              buttons={[
                {
                  value: 'measurements',
                  label: 'Measurements',
                  icon: 'clipboard-edit-outline',
                  style: styles.scopeButton,
                  labelStyle: styles.scopeButtonLabel,
                },
                {
                  value: 'habits',
                  label: 'Habits',
                  icon: 'checkbox-multiple-marked-outline',
                  style: styles.scopeButton,
                  labelStyle: styles.scopeButtonLabel,
                }
              ]}
            />
          </Surface>
        </View>
      </View> */}
    </>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scopeButtonsContainer: {
    position: 'absolute',
    top: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  scopeButtonsWrapper: {
    minWidth: 400,
    borderRadius: 24,
  },
  scopeButtons: {
    height: 44,
    borderRadius: 24,
  },
  scopeButton: {
    borderWidth: 0,
    borderRadius: 24,
  },
  scopeButtonLabel: {    
    height: 28,
    lineHeight: 28,
    borderRadius: 24,
  },
});

export default ConfigurationScreen;
