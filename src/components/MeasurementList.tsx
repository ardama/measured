import { useState } from "react";
import { View, Pressable, TextInput, FlatList, StyleSheet, SectionList } from "react-native";

import { useMeasurements, useUser } from "@/store/selectors";
import { addMeasurement, removeMeasurement, editMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { type Measurement, createMeasurement, createMeasurementUnit } from "@/types/measurements";
import { type UnknownAction } from "@reduxjs/toolkit";
import { Card, Icon, Surface, Text } from 'react-native-paper';

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

  if (!isEditing) return (
    <Pressable onPress={() => setIsEditing(true)}>
      <Card style={itemStyles.item} elevation={2}>
        <Card.Title
          title={measurement.activity || 'Sample activity'}
          subtitle={measurement.variant || 'Sample variant'}
          left={() => <Icon source={'clock'} size={40} /> }
          right={() => <>
            <Text>{measurement.step || 'Sample step'} {measurement.unit.label || 'Sample unit'}</Text>
          </>}
        />
      </Card>
    </Pressable>
  );

  return (
    <Card elevation={2} style={itemStyles.item}>
      <TextInput
        style={itemStyles.input}
        value={editedMeasurement.activity}
        onChangeText={(text) => setEditedMeasurement({ ...editedMeasurement, activity: text })}
      />
      <TextInput
        style={itemStyles.input}
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
        style={itemStyles.input}
        value={editedMeasurement.step.toString()}
        onChangeText={(text) => {
          const step = parseFloat(text);
          if (isNaN(step) || !isFinite(step) || step < 0) return;

          setEditedMeasurement({ ...editedMeasurement, step: step });
        }}
        keyboardType="numeric"
      />
      <View style={itemStyles.buttons}>
        <Pressable style={itemStyles.saveButton} onPress={handleSave}>
          <Text>Save</Text>
        </Pressable>
        <Pressable style={itemStyles.cancelButton} onPress={() => setIsEditing(false)}>
          <Text>Cancel</Text>
        </Pressable>
        <Pressable style={itemStyles.deleteButton} onPress={() => onDelete(measurement)}>
          <Text>Delete</Text>
        </Pressable>
      </View>
    </Card>
  )
};

const itemStyles = StyleSheet.create({
  item: {
    display: 'flex',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    color: "red",
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
  saveButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    margin: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    margin: 4,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    margin: 4,
  },
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

  const handleAddMeasurement = (): UnknownAction  => dispatch(addMeasurement(createMeasurement(user, '', '', 'duration', createMeasurementUnit('minutes', 'm'), 15)));

  return (
    <Surface elevation={1} style={listStyles.container}>
      <Text variant='titleLarge'>Measurements</Text>
      <FlatList
        data={measurements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MeasurementItem
            measurement={item}
            onEdit={handleEditMeasurement}
            onDelete={handleDeleteMeasurement}
          />
        )}
      />
      <Pressable style={listStyles.addButton} onPress={handleAddMeasurement}>
        <Text>Add</Text>
      </Pressable>
    </Surface>
  );
};

const listStyles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#4ecdc4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  }
})


export default MeasurementList;