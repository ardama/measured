import { useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useMeasurementUnits, useMeasurementsByMeasurementUnit } from "@/store/selectors";
import { editMeasurementUnit, removeMeasurementUnit, addMeasurementUnit } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { createMeasurementUnit, measurementTypeData, type MeasurementUnit } from "@/types/measurements";
import { Button, Icon, IconButton, Menu, Surface, Text, TextInput, AnimatedFAB, FAB, useTheme, Chip } from 'react-native-paper';
import { forWeb } from '@u/helpers';

const UnitItem = ({ unit, onEdit, onDelete }: {
    unit: MeasurementUnit;
    onEdit: (unit: MeasurementUnit) => void;
    onDelete: (unit: MeasurementUnit) => void;
  }): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const getInitialEditedUnit = (unit: MeasurementUnit) => ({ ...unit });

  const [editedUnit, setEditedUnit] = useState(getInitialEditedUnit(unit));
  const theme = useTheme();
  const typeActiveColor = theme.colors.primary;
  const typeInactiveColor = theme.colors.onSurfaceDisabled;
  
  const measurements = useMeasurementsByMeasurementUnit(unit);
  const measurementCount = measurements.length;

  const handleSave = () => {
    if (hasErrors()) return;
    const nextUnit = {
      ...editedUnit,
      label: editedUnit.label.trim(),
      abbreviation: editedUnit.abbreviation.trim(),
    };
    onEdit(nextUnit);
    setIsEditing(false);
    setEditedUnit(getInitialEditedUnit(nextUnit));
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedUnit(getInitialEditedUnit(unit));
  }

  const hasErrors = () => {
    if (getLabelErrors().hasError) return true;
    return false
  }

  const getLabelErrors = () => {
    if (!editedUnit.label) return { hasError: true, msg: ''};
    return { hasError: false, msg: ''};
  }

  if (!isEditing) return (
    <Surface style={[itemStyles.item, itemStyles.itemCollapsed]} elevation={1}>
      <Pressable style={itemStyles.container} onPress={() => !unit.isDefault && setIsEditing(true)}>
        <View style={itemStyles.typeIcons}>
          {measurementTypeData.map(({ type, icon }) => (
            <View key={type} style={itemStyles.typeIcon}>
              <Icon source={icon} size={24} color={editedUnit.types.includes(type) ? typeActiveColor : typeInactiveColor} />
            </View>
          ))}
        </View>
        <View style={itemStyles.content}>
          <Text variant='titleMedium'>{unit.label === ' ' ? 'Unitless' : unit.label || 'New unit'}</Text>
          <Text variant='bodyLarge' style={{ marginLeft: 4 }}>{unit.abbreviation ? `(${unit.abbreviation})` : ''}</Text>
        </View>
        <View style={{ marginVertical: 12, marginRight: -8}}>
            <Chip
              icon='clipboard-multiple-outline'
              disabled={!measurementCount}
            >
              <Text style={{ color: !!measurementCount ? theme.colors.primary : theme.colors.onSurfaceDisabled }} variant='titleSmall'>{measurementCount} Measurement{measurementCount === 1 ? '' : 's'}</Text>
            </Chip>
          </View>
        <Menu
          visible={isMenuVisible}
          onDismiss={() => setIsMenuVisible(false)}
          anchor={
            <IconButton
              style={{ margin: 8 }} icon='dots-vertical' size={24}
              onPress={() => { setIsMenuVisible(true); }}
              onResponderRelease={(e) => { e.preventDefault(); }}
              disabled={!unit.isDeletable}
            />
          }
          anchorPosition='bottom'
        >
          <Menu.Item leadingIcon='archive-outline' onPress={() => { onDelete(unit); }} title="Archive" />
          <Menu.Item leadingIcon='delete-outline' onPress={() => { onDelete(unit); }} title="Delete" />
        </Menu>
      </Pressable>
    </Surface>
  );

  return (
    <Surface elevation={1} style={[itemStyles.item, itemStyles.itemExpanded]}>
      {
        measurementTypeData.map((data) => {
          const included = editedUnit.types.includes(data.type);
          return  included ? (
            <IconButton
              key={data.type}
              style={{ marginTop: 4, marginBottom: 16, flex: 1, width: 0, margin: 4 }}
              mode='contained'
              onPress={() => {
                setEditedUnit({ ...editedUnit, types: editedUnit.types.filter((type) => type !== data.type) });
              }}
              icon={data.icon}
            />
          ) : (
            <IconButton
              key={data.type}
              style={{ marginTop: 4, marginBottom: 16, flex: 1, width: 0, margin: 4 }}
              onPress={() => {
                setEditedUnit({ ...editedUnit, types: [...editedUnit.types, data.type] });                
              }}
              icon={data.icon}
            />
          );
        })
      }
      <TextInput
        label="Label"
        style={itemStyles.input}
        mode='outlined'
        value={editedUnit.label || ' '}
        onChangeText={(text) => setEditedUnit({ ...editedUnit, label: text })}
      />
      <TextInput
        label="Abbreviation"
        style={itemStyles.input}
        mode='outlined'
        value={editedUnit.abbreviation || ' '}
        onChangeText={(text) => setEditedUnit({ ...editedUnit, abbreviation: text })}
      />
      <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'flex-end' }}>
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
  )
};

const itemStyles = StyleSheet.create({
  item: {
    marginBottom: 8,
    borderRadius: 8,
  },
  itemCollapsed: {
    height: 56,
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
    flexDirection: 'row',
    height: '100%',
    paddingVertical: 16,
  },
  measurementCount: {
    position: 'relative',
    height: 32,
    width: 32,
    marginTop: 11,
  },
  measurementCountText: {
    position: 'absolute',
    top: 4.5,
    left: 11,
    width: 16,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '900'
  },
  input: {
    marginBottom: 12, 
    width: '100%',
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

const Units = () => {
  const dispatch = useDispatch();
  const units = useMeasurementUnits();

  const scrollViewRef = useRef<ScrollView>(null);
  const [isFABExtended, setIsFABExtended] = useState(true);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const currentScrollPosition =  Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
    setIsFABExtended(currentScrollPosition <= 0);
  };

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleEditMeasurementUnit = (editedUnit: MeasurementUnit) => dispatch(editMeasurementUnit({
    id: editedUnit.id,
    updates: editedUnit,
  }));
  
  const handleDeleteMeasurementUnit = (unit: MeasurementUnit) => dispatch(removeMeasurementUnit(unit.id));

  const handleAddMeasurement = () => {
    dispatch(addMeasurementUnit(createMeasurementUnit('', '')));
    scrollToEnd();
  }

  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer} onScroll={handleScroll} scrollEventThrottle={64}>
        <View style={listStyles.unitsContainer}>
            {
              units.map((unit) => (
                <UnitItem
                  key={unit.id}
                  unit={unit}
                  onEdit={handleEditMeasurementUnit}
                  onDelete={handleDeleteMeasurementUnit}
                  
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
            label='New Unit'
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
  unitsContainer: {
    padding: 16,
    paddingBottom: 96
  },
  createButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
})


export default Units;