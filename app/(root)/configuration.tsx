import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@c/ThemedView';

import MeasurementList from '@c/MeasurementList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@c/ThemedText';
import { Surface, Text } from 'react-native-paper';

const ConfigurationScreen = () => {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView>
        <Surface style={{ flex: 1 }} elevation={0}>
          <Text>CONFIGURATION</Text>
          <MeasurementList />

        </Surface>
      </SafeAreaView>
    </ThemedView>
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