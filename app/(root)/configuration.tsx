import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@c/ThemedView';

import MeasurementList from '@c/MeasurementList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@c/ThemedText';
import { Appbar, Surface, Text } from 'react-native-paper';
import { TabScreen, Tabs, TabsProvider } from 'react-native-paper-tabs';

const ConfigurationScreen = () => {
  return (
    <>
      <Appbar.Header>
        <Appbar.Action icon="menu" onPress={() => {}} />
        <Appbar.Content title="Configuration" />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>
      <TabsProvider defaultIndex={0}
      >
        <Tabs
          showTextLabel
          iconPosition='top'
        >
          <TabScreen label='Habits' icon='checkbox-multiple-outline'>
            <MeasurementList />
          </TabScreen>
          <TabScreen label='Measurements' icon='pencil-ruler'>
            <MeasurementList />
          </TabScreen>
          <TabScreen label='Units' icon='ruler'>
            <MeasurementList />
          </TabScreen>
        </Tabs>
      </TabsProvider>
    </>
    // <ThemedView style={{ flex: 1 }}>
    //   <SafeAreaView>
    //     <Surface style={{ flex: 1 }} elevation={0}>
    //       <Text>CONFIGURATION</Text>

    //     </Surface>
    //   </SafeAreaView>
    // </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

export default ConfigurationScreen;