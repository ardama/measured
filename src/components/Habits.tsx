import { useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useHabits, useMeasurementUnits, useMeasurements, useUser } from "@/store/selectors";
import { editHabit, removeHabit, addHabit, addMeasurement, addMeasurementUnit } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { createHabit, habitOperatorData, type Habit } from "@/types/habits";
import { Button, Icon, IconButton, Menu, Surface, Text, TextInput, AnimatedFAB, FAB, useTheme as usePaperTheme, Chip, Divider, useTheme } from 'react-native-paper';
import { forWeb } from '@u/helpers';
import { createMeasurement, createMeasurementUnit, measurementTypeData } from '@t/measurements';
import { EmptyError, NoError, Error } from '@u/constants/Errors';

const HabitItem = ({ habit, onEdit, onDelete }: {
    habit: Habit;
    onEdit: (habit: Habit) => void;
    onDelete: (habit: Habit) => void;
  }): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  const [isMeasurementMenuVisible, setIsMeasurementMenuVisible] = useState(false);
  const [isOperatorMenuVisible, setIsOperatorMenuVisible] = useState(false);
  const [isDaysPerWeekMenuVisible, setIsDaysPerWeekMenuVisible] = useState(false);
  const [isPointsMenuVisible, setIsPointsMenuVisible] = useState(false);

  const getInitialEditedHabit = (habit: Habit) => ({
    ...habit,
    daily: habit.daily?.toString(),
    daysPerWeek: habit.daysPerWeek?.toString(),
    points: habit.points?.toString(),
  });
  const [editedHabit, setEditedHabit] = useState(getInitialEditedHabit(habit));
  
  const measurements = useMeasurements();
  const typeData = measurementTypeData.find((data) => data.type === habit.measurement.type) || measurementTypeData[0];
  const operatorData = habitOperatorData.find((data) => data.operator === habit.operator) || habitOperatorData[0];
  const unit = editedHabit.measurement?.unit || '';
  const theme = useTheme()

  const handleSave = () => {
    if (hasErrors()) return;
    const nextHabit = {
      ...editedHabit,
      name: editedHabit.name.trim(),
      daily: editedHabit.daily ? parseInt(editedHabit.daily) : undefined,
      daysPerWeek: editedHabit.daysPerWeek ? parseInt(editedHabit.daysPerWeek) : 7,
      points: editedHabit.points ? parseInt(editedHabit.points) : 1,
    };
    onEdit(nextHabit);
    setIsEditing(false);
    setEditedHabit(getInitialEditedHabit(nextHabit));
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedHabit(getInitialEditedHabit(habit));
  }

  const hasErrors = () => {
    if (getNameErrors().hasError) return true;
    if (getTargetErrors().hasError) return true;
    return false
  }

  const getNameErrors = () => {
    if (!editedHabit.name || !editedHabit.name.trim()) return EmptyError;
    return NoError;
  }

  const getTargetErrors = () => {
    if (!editedHabit.daily) return EmptyError;
    const target = parseFloat(editedHabit.daily);
    if (isNaN(target) || !isFinite(target) || target < 0) return Error('Invalid target');
    return NoError;
  }

  if (!isEditing) return (
    <Surface style={[itemStyles.item, itemStyles.itemCollapsed]} elevation={1}>
      <Pressable style={itemStyles.container} onPress={() => setIsEditing(true)}>
        <View style={itemStyles.content}>
          <View style={{ flexDirection: 'row', width: '100%', marginBottom: 8 }}>
            <Text variant='titleMedium' style={{flex: 1, lineHeight: 40 }}>{habit.name || 'New habit'}</Text>
            <Menu
              visible={isMenuVisible}
              onDismiss={() => setIsMenuVisible(false)}
              anchor={
                <IconButton
                  style={{ margin: 0 }} icon='dots-vertical' size={24}
                  onPress={() => { setIsMenuVisible(true); }}
                  onResponderRelease={(e) => { e.preventDefault(); }}
                />
              }
              anchorPosition='bottom'
            >
              <Menu.Item leadingIcon='archive-outline' onPress={() => { onDelete(habit); }} title="Archive" />
              <Menu.Item leadingIcon='delete-outline' onPress={() => { onDelete(habit); }} title="Delete" />
            </Menu>
          </View>
          <View style={{ flexDirection: 'row', width: '100%' }}>
            <Chip icon={typeData.icon} mode='flat'>
              <Text variant='titleMedium'>{habit.measurement.activity}</Text>
              {habit.measurement.variant && <Text variant='bodyLarge'>: {habit.measurement.variant}</Text>}
            </Chip>
            {habit.measurement.type !== 'bool' && (
              <>
                <View style={itemStyles.operatorIcon}>
                  <Icon source={operatorData.icon} size={28} color={theme.colors.inversePrimary} />
                </View>
                <Chip>
                  <Text variant='titleMedium'>{habit.daily}</Text>
                  <Text variant='bodyLarge' style={{ marginLeft: 4 }}>{habit.measurement.unit}</Text>
                </Chip>
              </>
            )}
          </View>
        </View>
      </Pressable>
    </Surface>
  );

  return (
    <Surface elevation={1} style={[itemStyles.item, itemStyles.itemExpanded]}>
      <TextInput
        label="Name"
        style={itemStyles.input}
        mode='outlined'
        value={editedHabit.name || ' '}
        onChangeText={(text) => setEditedHabit({ ...editedHabit, name: text })}
      />
      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={[itemStyles.input, itemStyles.inputPartial]}>
          <Menu
            style={{ maxWidth: 600 }}
            contentStyle={{ maxWidth: 600 }}
            visible={isMeasurementMenuVisible}
            onDismiss={() => setIsMeasurementMenuVisible(false)}
            anchor={
              <Pressable onPress={() => { setIsMeasurementMenuVisible(true); }}>
                <TextInput
                  label="Measurement"
                  mode='outlined'
                  readOnly
                  value={`${editedHabit.measurement.activity}: ${editedHabit.measurement.variant}`}
                  />
              </Pressable>
            }
            anchorPosition='bottom'
          >
            {
              measurements.map((measurement) => (
                <Menu.Item
                  style={{ maxWidth: 600 }}
                  contentStyle={{ maxWidth: 600 }}
                  key={measurement.id}
                  title={`${measurement.activity}: ${measurement.variant}`}
                  leadingIcon={(measurementTypeData.find(({ type }) => type === measurement.type) || measurementTypeData[0]).icon}
                  onPress={() => {
                    const nextEditedHabit = { ...editedHabit, measurement };
                    if (measurement.type === 'bool') {
                      nextEditedHabit.operator = '>';
                      nextEditedHabit.daily = '0';
                    }
                    setEditedHabit(nextEditedHabit);
                    setIsMeasurementMenuVisible(false);
                  }}
                />
              ))
            }
          </Menu>
        </View>
        {editedHabit.measurement.type !== 'bool' && (
          <>
            <View style={[itemStyles.input, itemStyles.inputPartial, { maxWidth: 78 }]}>
              <Menu
                visible={isOperatorMenuVisible}
                onDismiss={() => setIsOperatorMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => { setIsOperatorMenuVisible(true); }}>
                    <TextInput
                      label="Operator"
                      mode='outlined'
                      readOnly
                      value={editedHabit.operator}
                    />
                  </Pressable>
                }
                anchorPosition='bottom'
              >
                {
                  habitOperatorData.map(({ operator, icon, label }) => (
                    <Menu.Item
                      key={operator}
                      title={label}
                      leadingIcon={icon}
                      onPress={() => {
                        setEditedHabit({ ...editedHabit, operator });
                        setIsOperatorMenuVisible(false);
                      }}
                    />
                  ))
                }
              </Menu>
            </View>
            <TextInput
              label="Target"
              style={[itemStyles.input, itemStyles.inputPartial, { maxWidth: 120 }]}
              mode='outlined'
              error={!!getTargetErrors().hasError}
              value={editedHabit.daily?.toString()}
              onChangeText={(text) => {
                setEditedHabit({ ...editedHabit, daily: text });
              }}
              right={<TextInput.Affix text={unit || ''} />}
              keyboardType="numeric"
            />
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'flex-end' }}>
        <View style={[itemStyles.input, itemStyles.inputPartial, { minWidth: 108, maxWidth: 108 }]}>
          <Menu
            visible={isDaysPerWeekMenuVisible}
            onDismiss={() => setIsDaysPerWeekMenuVisible(false)}
            anchor={
              <Pressable onPress={() => { setIsDaysPerWeekMenuVisible(true); }}>
                <TextInput
                  label="Frequency"
                  mode='outlined'
                  readOnly
                  value={editedHabit.daysPerWeek}
                  right={<TextInput.Affix text="/week" />}
                />
              </Pressable>
            }
            anchorPosition='bottom'
          >
            {
              [1, 2, 3, 4, 5, 6, 7].map((num) => (
                <Menu.Item
                  key={num}
                  title={num}
                  onPress={() => {
                    setEditedHabit({ ...editedHabit, daysPerWeek: num.toString() });
                    setIsDaysPerWeekMenuVisible(false);
                  }}
                />
              ))
            }
          </Menu>
        </View>
        <View style={[itemStyles.input, itemStyles.inputPartial, { minWidth: 108, maxWidth: 108, marginHorizontal: 12 }]}>
          <Menu
            visible={isPointsMenuVisible}
            onDismiss={() => setIsPointsMenuVisible(false)}
            anchor={
              <Pressable onPress={() => { setIsPointsMenuVisible(true); }}>
                <TextInput
                  label="Points"
                  mode='outlined'
                  readOnly
                  value={editedHabit.points}
                  right={<TextInput.Affix text="points" />}
                />
              </Pressable>
            }
            anchorPosition='bottom'
          >
            {
              [1, 2, 3, 4, 5].map((num) => (
                <Menu.Item
                  key={num}
                  title={num}
                  onPress={() => {
                    setEditedHabit({ ...editedHabit, daysPerWeek: num.toString() });
                    setIsDaysPerWeekMenuVisible(false);
                  }}
                />
              ))
            }
          </Menu>
        </View>
        <View style={{ flex: 1 }} />
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
    height: 116,
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
  typeIcon: {
    height: 24,
    width: 24,
    paddingVertical: 2,
  },
  operatorIcon: {
    height: 36,
    width: 36,
    padding: 4,
  },
  content: {
    flex: 1,
    height: '100%',
    paddingTop: 8,
    paddingLeft: 20,
  },
  input: {
    marginBottom: 12, 
    width: '100%',
  },
  inputPartial: {
    width: 'auto',
    flexGrow: 1,
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

const Habits = () => {
  const dispatch = useDispatch();
  const habits = useHabits();
  const user = useUser();
  const measurements = useMeasurements();

  const scrollViewRef = useRef<ScrollView>(null);
  const [isFABExtended, setIsFABExtended] = useState(true);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const currentScrollPosition =  Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
    setIsFABExtended(currentScrollPosition <= 0);
  };

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleEditHabit = (editedHabit: Habit) => dispatch(editHabit({
    id: editedHabit.id,
    updates: editedHabit,
  }));
  
  const handleDeleteHabit = (habit: Habit) => dispatch(removeHabit(habit.id));

  const handleAddMeasurement = () => {
    let measurement = measurements.length ? measurements[0] : null;
    if (!measurement) {
      measurement = createMeasurement(user.id, 'New measurement', 'New variant', 'duration', 'min', 15);
      dispatch(addMeasurement(measurement));
    }
    dispatch(addHabit(createHabit(user.id, measurement, 'New habit', '>', 0)));
    scrollToEnd();
  }

  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer} onScroll={handleScroll} scrollEventThrottle={64}>
        <View style={listStyles.habitsContainer}>
            {
              habits.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onEdit={handleEditHabit}
                  onDelete={handleDeleteHabit}
                  
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
            label='New Habit'
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
  habitsContainer: {
    padding: 16,
    paddingBottom: 96
  },
  createButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
})


export default Habits;