import { useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useMeasurements, useUser, useMeasurementUnits, useAllMeasurementUnitsByMeasurementType, useMeasurementUnitsByMeasurementType, useHabitsByMeasurement } from "@/store/selectors";
import { addMeasurement, removeMeasurement, editMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { type Measurement, createMeasurement, createMeasurementUnit, measurementTypeData, type MeasurementType, generateDefaultEmptyUnit, defaultMeasurementUnits } from "@/types/measurements";
import { Button, Icon, IconButton, Menu, SegmentedButtons, Surface, Text, TextInput, AnimatedFAB, FAB, HelperText, Chip, useTheme } from 'react-native-paper';
import { forWeb } from '@u/helpers';
import { EmptyError, Error, NoError } from '@u/constants/Errors';

const MeasurementItem = ({ measurement, onEdit, onDelete }: {
    measurement: Measurement;
    onEdit: (measurement: Measurement) => void;
    onDelete: (measurement: Measurement) => void;
  }): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isUnitMenuVisible, setIsUnitMenuVisible] = useState(false);
  
  const getInitialEditedMeasurement = (measurement: Measurement) => ({
    ...measurement,
    step: measurement.step.toString(),
  });
  const [editedMeasurement, setEditedMeasurement] = useState(getInitialEditedMeasurement(measurement));

  const units = defaultMeasurementUnits;
  const habits = useHabitsByMeasurement(measurement);
  const habitCount = habits.length;
  
  const theme = useTheme();
  const typeActiveColor = theme.colors.primary;
  const typeInactiveColor = theme.colors.onSurfaceDisabled;
  
  const handleSave = () => {
    if (hasErrors()) return;

    const step = editedMeasurement.type !== 'bool' ? parseFloat(editedMeasurement.step) : 1;
    const unit = editedMeasurement.type !== 'bool' ? editedMeasurement.unit : '';
    const nextMeasurement = {
      ...editedMeasurement,
      activity: editedMeasurement.activity.trim(),
      variant: editedMeasurement.variant.trim(),
      unit,
      step,
    };

    onEdit(nextMeasurement);
    setIsEditing(false);
    setEditedMeasurement(getInitialEditedMeasurement(nextMeasurement))
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedMeasurement(getInitialEditedMeasurement(measurement));
  }

  const hasErrors = () => {
    if (getActivityErrors().hasError) return true;
    if (getVariantErrors().hasError) return true;
    if (getStepErrors().hasError) return true;
    return false
  }

  const getActivityErrors = () => {
    return editedMeasurement.activity ? NoError : EmptyError;
  }

  const getVariantErrors = () => {
    return NoError;
  }

  const getStepErrors = () => {
    if (!editedMeasurement.step) return EmptyError;
    const step = parseFloat(editedMeasurement.step);
    if (isNaN(step) || !isFinite(step) || step < 0) return Error('Invalid step');
    return NoError;
  }

  const typeData = measurementTypeData.find((data) => data.type === measurement.type) || measurementTypeData[0];
  const editedTypeData = measurementTypeData.find((data) => data.type === editedMeasurement.type) || measurementTypeData[0];

  if (!isEditing) return (
    <Surface style={[itemStyles.item, itemStyles.itemCollapsed]} elevation={1}>
      <Pressable style={itemStyles.container} onPress={() => setIsEditing(true)}>
          <View style={itemStyles.typeIconCollapsed}>
            <Icon source={typeData.icon} size={40} />
          </View>
          <View style={itemStyles.content}>
            <Text variant='titleMedium'>{measurement.activity || 'New activity'}</Text>
            <Text variant='bodyMedium'>{measurement.variant || 'New variant'}</Text>
          </View>
          <View style={{ marginVertical: 24, marginRight: -8}}>
            <Chip
              icon='checkbox-multiple-outline'
              disabled={!habitCount}
            >
              <Text style={{ color: !!habitCount ? theme.colors.primary : theme.colors.onSurfaceDisabled }} variant='titleSmall'>{habitCount} Habit{habitCount === 1 ? '' : 's'}</Text>
            </Chip>
          </View>
          <Menu
            visible={isMenuVisible}
            onDismiss={() => setIsMenuVisible(false)}
            anchor={
              <IconButton
                style={{ marginVertical: 20, marginHorizontal: 16 }} icon='dots-vertical' size={24}
                onPress={() => { setIsMenuVisible(true); }}
                onResponderRelease={(e) => { e.preventDefault(); }}
              />
            }
            anchorPosition='bottom'
          >
            <Menu.Item leadingIcon='archive-outline' onPress={() => { onDelete(measurement); }} title="Archive" />
            <Menu.Item leadingIcon='delete-outline' onPress={() => { onDelete(measurement); }} title="Delete" />
          </Menu>
      </Pressable>
    </Surface>
  );

  return (
    <Surface elevation={1} style={[itemStyles.item, itemStyles.itemExpanded]}>
      <View style={{ width: '100%', flexDirection: 'row', marginBottom: 8}}>
        {
          measurementTypeData.map((data) => data.type === editedMeasurement.type ? (
            <Button
              key={data.type}
              style={{ marginRight: 8, marginBottom: 16, borderRadius: 200 }}
              mode='contained-tonal'
              onPress={() => {
                setEditedMeasurement({ ...editedMeasurement, type: data.type })
              }}
              compact
            >
              <View style={{ flexDirection: 'row', top: 4, paddingHorizontal: 5, margin: -2 }}>
                <Icon source={data.icon} size={22} />
                <Text variant='titleMedium' style={{ padding: 4, marginTop: -4, top: -2 }}>{data.label}</Text>
              </View>
            </Button>
          ) : (
            <Button
              key={data.type}
              style={{ marginRight: 8, marginBottom: 16, borderRadius: 200 }}
              mode='text'
              onPress={() => {
                setEditedMeasurement({ ...editedMeasurement, type: data.type })
              }}
              compact
            >
              <View style={{ flexDirection: 'row', top: 1, paddingHorizontal: 4, paddingVertical: 2, marginHorizontal: -1 }}>
                <Icon source={data.icon} size={22} />
              </View>
            </Button>
          ))
        }
      </View>
      <TextInput
        label="Activity"
        style={itemStyles.input}
        mode='outlined'
        error={getActivityErrors().hasError}
        value={editedMeasurement.activity || ' '}
        onChangeText={(text) => setEditedMeasurement({ ...editedMeasurement, activity: text })}
        />
      <TextInput
        label="Variant"
        style={itemStyles.input}
        mode='outlined'
        error={getVariantErrors().hasError}
        value={editedMeasurement.variant || ' '}
        onChangeText={(text) => setEditedMeasurement({ ...editedMeasurement, variant: text })}
      />
      <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'flex-end' }}>
        {editedMeasurement.type === 'bool' ? null : (
          <>
            <View style={[itemStyles.input, itemStyles.inputPartial, { maxWidth: 100 }]}>
              <TextInput
                label="Step"
                mode='outlined'
                error={!!getStepErrors().hasError}
                value={editedMeasurement.step.toString() || ' '}
                onChangeText={(text) => {
                  setEditedMeasurement({ ...editedMeasurement, step: text });
                }}
                keyboardType="numeric"
              />
            </View>
            <View style={[itemStyles.input, itemStyles.inputPartial]}>
              <TextInput
                label='Unit'
                mode='outlined'
                value={editedMeasurement.unit}
                onChangeText={(text) => {
                  setEditedMeasurement({ ...editedMeasurement, unit: text });
                }}
              />
            </View>
          </>
        )}
        <View style={itemStyles.buttons}>
          <Button mode="contained-tonal" style={itemStyles.button} onPress={handleSave} disabled={hasErrors()}>
            <Text>Save</Text>
          </Button>
          <Button mode="contained-tonal" style={itemStyles. button} onPress={handleCancel}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </Surface>
  );
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
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  typeIconCollapsed: {
    height: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  typeIcons: {
    flexDirection: 'row',
    alignContent: 'space-between',
    flexWrap: 'wrap',
    height: 56,
    width: 128,
    paddingVertical: 17,
    marginLeft: 16,
    marginRight: 8,
  },
  typeIcon: {
    height: 24,
    width: 24,
    marginRight: 8,
  },
  content: {
    flex: 1,
    height: '100%',
    paddingVertical: 16,
  },
  habitCount: {
    position: 'relative',
    height: 32,
    width: 32,
    marginTop: 24,
  },
  habitCountText: {
    position: 'absolute',
    top: 2.5,
    left: 11,
    width: 16,
    textAlign: 'center',
    fontWeight: '900',
    lineHeight: 20,
  },
  input: {
    marginBottom: 12, 
    width: '100%',
  },
  inputPartial: {
    width: 'auto',
    flex: 1,
    marginRight: 8, 
  },
  buttons: {
    height: 68,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  button: {
    marginLeft: 8
  },
});

const Measurements = () => {
  const dispatch = useDispatch();
  const measurements = useMeasurements();
  const units = useMeasurementUnits();
  const user = useUser();

  const scrollViewRef = useRef<ScrollView>(null);
  const [isFABExtended, setIsFABExtended] = useState(true);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const currentScrollPosition =  Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
    setIsFABExtended(currentScrollPosition <= 0);
  };

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleEditMeasurement = (editedMeasurement: Measurement) => dispatch(editMeasurement({
    id: editedMeasurement.id,
    updates: editedMeasurement,
  }));
  
  const handleDeleteMeasurement = (measurement: Measurement) => dispatch(removeMeasurement(measurement.id));

  const handleAddMeasurement = () => {
    dispatch(addMeasurement(createMeasurement(user.id, 'New activity', 'New variant', 'duration', 'min', 15)));
    scrollToEnd();
  }

  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer} onScroll={handleScroll} scrollEventThrottle={64}>
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
      {
        forWeb((
          <FAB
            style={listStyles.createButton}
            onPress={handleAddMeasurement}
            icon={'plus'}
            customSize={64}
          />
        ), (
          <AnimatedFAB
            style={listStyles.createButton}
            onPress={handleAddMeasurement}
            icon={'plus'}
            label='New Measurement'
            extended={isFABExtended}
            animateFrom='right'
            iconMode='dynamic'
          />
        ))
      }
      
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
  createButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
})


export default Measurements;