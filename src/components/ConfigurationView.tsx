import React from "react";
import { Text, View } from "react-native";
import MeasurementList from "./MeasurementList";

const ConfigurationView = () => {
  return (
    <View>
      <Text>
        Configuration
      </Text>
      <MeasurementList />
    </View>
  )
}

export default ConfigurationView;