import { useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, Platform } from "react-native";

import { useMeasurements, useUser } from "@/store/selectors";
import { addMeasurement, removeMeasurement, editMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { type Measurement, createMeasurement, createMeasurementUnit, measurementTypeData, type MeasurementType } from "@/types/measurements";
import { type UnknownAction } from "@reduxjs/toolkit";
import { Button, Card, FAB, Icon, IconButton, List, SegmentedButtons, Surface, Text, TextInput } from 'react-native-paper';
import Select from 'react-native-picker-select';
import { Picker } from '@react-native-picker/picker';

const MeasurementItem = ({ measurement, onEdit, onDelete }: {
    measurement: Measurement;
    onEdit: (measurement: Measurement) => void;
    onDelete: (measurement: Measurement) => void;
  }): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeasurement, setEditedMeasurement] = useState(measurement);

  const handleSave = () => {
    onEdit(editedMeasurement);
    setIsEditing(false);
  };

  const typeData = measurementTypeData.find((data) => data.type === measurement.type) || measurementTypeData[0];

  if (!isEditing) return (
    <Surface style={[itemStyles.item, itemStyles.itemCollapsed]} elevation={1}>
      <Pressable style={itemStyles.content} onPress={() => setIsEditing(true)}>
          <View style={itemStyles.left}>
            <Icon source={typeData.icon} size={40} />
          </View>
          <View style={itemStyles.center}>
            <Text variant='titleMedium'>{measurement.activity || 'Sample activity'}</Text>
            <Text variant='bodyMedium'>{measurement.variant || 'Sample variant'}</Text>
          </View>
          <View style={itemStyles.right}>
            <View style={Platform.OS === 'web' ? {} : { marginTop: 3 }}>
              <Icon source='plus-minus' size={16}/>
            </View>
            <Text>{measurement.step || 'Sample step'} {measurement.unit.label || 'Sample unit'}</Text>
          </View>
      </Pressable>
    </Surface>
  );

  return (
    <Surface elevation={1} style={[itemStyles.item, itemStyles.itemExpanded]}>
      <SegmentedButtons
        style={{ marginBottom: 10 }}
        value={editedMeasurement.type}
        onValueChange={(value) => setEditedMeasurement({ ...editedMeasurement, type: value})}
        buttons={measurementTypeData.map((data) => ({ label: data.label, value: data.type, icon: data.icon }))}
      />
      <TextInput
        label="Activity"
        style={itemStyles.input}
        mode='outlined'
        value={editedMeasurement.activity}
        onChangeText={(text) => setEditedMeasurement({ ...editedMeasurement, activity: text })}
        />
      <TextInput
        label="Variant"
        style={itemStyles.input}
        mode='outlined'
        value={editedMeasurement.variant}
        onChangeText={(text) => setEditedMeasurement({ ...editedMeasurement, variant: text })}
        />
      {/* <Picker
        style={itemStyles.picker}
        selectedValue={editedMeasurement.type}
        onValueChange={(itemValue) => setEditedMeasurement({ ...editedMeasurement, type: itemValue })}
      >
        <Picker.Item label="Duration" value="duration" />
        <Picker.Item label="Time" value="time" />
        <Picker.Item label="Count" value="count" />
        <Picker.Item label="Boolean" value="bool" />
        </Picker> */}
      <TextInput
        label="Increment"
        style={itemStyles.input}
        mode='outlined'
        value={editedMeasurement.step.toString()}
        onChangeText={(text) => {
          const step = parseFloat(text);
          if (isNaN(step) || !isFinite(step) || step < 0) return;

          setEditedMeasurement({ ...editedMeasurement, step: step });
        }}
        keyboardType="numeric"
      />
      <View style={itemStyles.buttons}>
        <Button style={itemStyles.saveButton} onPress={handleSave}>
          <Text>Save</Text>
        </Button>
        <Button style={itemStyles.cancelButton} onPress={() => setIsEditing(false)}>
          <Text>Cancel</Text>
        </Button>
        <Button style={itemStyles.deleteButton} onPress={() => onDelete(measurement)}>
          <Text>Delete</Text>
        </Button>
      </View>
    </Surface>
  )
};

const itemStyles = StyleSheet.create({
  item: {
    marginBottom: 8,
    borderRadius: 8,
  },
  itemCollapsed: {
    height: 80,
  },
  itemExpanded: {
    padding: 16,
  },
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  left: {
    height: '100%',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  center: {
    flex: 1,
    height: '100%',
    paddingVertical: 16,
  },
  right: {
    flexDirection: 'row',
    height: '100%',
    padding: 16,
  },
  input: {
    marginBottom: 8, 
  },
  picker: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 4,
  },
  // saveButton: {
  //   flex: 1,
  //   backgroundColor: '#e0e0e0',
  //   padding: 8,
  //   borderRadius: 4,
  //   alignItems: 'center',
  //   margin: 4,
  // },
  // cancelButton: {
  //   flex: 1,
  //   backgroundColor: '#e0e0e0',
  //   padding: 8,
  //   borderRadius: 4,
  //   alignItems: 'center',
  //   margin: 4,
  // },
  // deleteButton: {
  //   flex: 1,
  //   backgroundColor: '#ff6b6b',
  //   padding: 8,
  //   borderRadius: 4,
  //   alignItems: 'center',
  //   margin: 4,
  // },
});

const MeasurementList = () => {
  const dispatch = useDispatch();
  const measurements = useMeasurements();
  const user = useUser();

  const handleEditMeasurement = (editedMeasurement: Measurement) => dispatch(editMeasurement({
    id: editedMeasurement.id,
    updates: editedMeasurement,
  }));
  
  const handleDeleteMeasurement = (measurement: Measurement) => dispatch(removeMeasurement(measurement.id));

  const handleAddMeasurement = (): UnknownAction  => dispatch(addMeasurement(createMeasurement(user.id, '', '', 'duration', createMeasurementUnit('minutes', 'm'), 15)));

  return (
    <View style={listStyles.container}>
      <ScrollView style={listStyles.scrollContainer}>
        <View style={listStyles.measurementsContainer}>
            {
              measurements.map((measurement) => (
                <MeasurementItem
                key={measurement.id}
                measurement={measurement}
                onEdit={handleEditMeasurement}
                onDelete={handleDeleteMeasurement}
                />
              ))
            }
        </View>
      </ScrollView>
      <FAB
        style={listStyles.createButton}
        onPress={handleAddMeasurement}
        icon={'plus'}
        customSize={72}
      />
    </View>
  );
};

const listStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 0,
    flex: 1,
  },
  measurementsContainer: {
    padding: 16,
    paddingBottom: 96
  },
  createButtonWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 80,
    width: 80,
    borderRadius: 40,
    padding: 0,
    margin: 0,
  },
  createButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,

    margin: 16,
  },
  createButtonIcon: {
    position: 'absolute',
    top: -20,
    left: -20,

  },
})


export default MeasurementList;