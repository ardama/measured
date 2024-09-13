import { useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useHabits, useMeasurement, useMeasurements, useUser } from "@/store/selectors";
import { editHabit, removeHabit, addHabit, addMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { createHabit, habitOperatorData, type Habit } from "@/types/habits";
import { Button, Icon, IconButton, Menu, Surface, Text, TextInput, AnimatedFAB, FAB, useTheme as usePaperTheme, Chip, Divider, useTheme, type MD3Theme } from 'react-native-paper';
import { formatNumber, forWeb } from '@u/helpers';
import { createMeasurement, measurementTypeData } from '@t/measurements';
import { EmptyError, NoError, Error } from '@u/constants/Errors';

const HabitItem = ({ habit, onEdit, onDelete }: {
    habit: Habit;
    onEdit: (habit: Habit) => void;
    onDelete: (habit: Habit) => void;
  }): JSX.Element => {
    
  const theme = useTheme();
  const itemStyles = createItemStyles(theme);

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

  const handleSave = () => {
    if (hasErrors()) return;
    const nextHabit = {
      ...editedHabit,
      name: editedHabit.name.trim(),
      daily: parseInt(editedHabit.daily) || 0,
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

  const measurements = useMeasurements();
  const operatorData = habitOperatorData.find((data) => data.operator === habit.operator) || habitOperatorData[0];
  
  if (!isEditing) {
    const measurement = useMeasurement(habit.measurementId);
    const typeData = measurementTypeData.find((data) => data.type === measurement?.type) || measurementTypeData[0];
    return measurement ? (
      <Surface style={[itemStyles.item, itemStyles.itemCollapsed]} elevation={1}>
        <Pressable style={itemStyles.container} onPress={() => setIsEditing(true)}>
          <View style={itemStyles.content}>
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <Text variant='titleMedium' style={{flex: 1, lineHeight: 40 }}>{habit.name}</Text>
              <View style={itemStyles.daysPerWeek}>
                <Icon source={`numeric-${habit.daysPerWeek}`} size={30} />
              </View>
              <View style={itemStyles.daysPerWeekMultiply}>
                <Icon source={`alpha-x`} size={26} />
              </View>
              <View style={itemStyles.points}>
                <Text style={itemStyles.pointsText} variant='titleSmall'>{habit.points}</Text>
                <View style={itemStyles.pointsIcon}>
                  <Icon source={`star-four-points`} size={16} color={theme.colors.onPrimary} />
                </View>
              </View>
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
              <View style={itemStyles.measurement}>
                <View style={itemStyles.measurementIcon}>
                  <Icon source={typeData.icon} size={20} />
                </View>
                <Text numberOfLines={1} variant='bodyLarge' style={itemStyles.measurementActivity}>{measurement.activity}</Text>
                {measurement.variant ? <Text numberOfLines={1} variant='bodyLarge' style={itemStyles.measurementVariant}> : {measurement.variant}</Text> : null}
              </View>
              {measurement.type !== 'bool' && (
                <>
                  <Text variant='bodyLarge' style={itemStyles.habitOperator}> {operatorData.label.toLowerCase()} </Text>
                  <Text variant='titleMedium' style={itemStyles.habitDaily}>{formatNumber(habit.daily)}</Text>
                  <Text variant='titleMedium' style={itemStyles.measurementUnit}> {measurement.unit}</Text>
                </>
              )}
            </View>
          </View>
        </Pressable>
      </Surface>
    ) : <></>;
  }

  const editedMeasurement = useMeasurement(editedHabit.measurementId);
  const unit = editedMeasurement?.unit || '';
  return editedMeasurement ? (
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
                  value={`${editedMeasurement.activity}${editedMeasurement.variant ? ` : ${editedMeasurement.variant}` : ''}`}
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
                  title={`${measurement.activity}${measurement.variant ? ` : ${measurement.variant}` : ''}`}
                  leadingIcon={(measurementTypeData.find(({ type }) => type === measurement.type) || measurementTypeData[0]).icon}
                  onPress={() => {
                    const nextEditedHabit = { ...editedHabit, measurementId: measurement.id };
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
        {editedMeasurement.type !== 'bool' && (
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
        <View style={[itemStyles.input, itemStyles.inputPartial, { minWidth: 92, maxWidth: 92 }]}>
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
                  right={<TextInput.Affix text="/wk" />}
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
        <View style={[itemStyles.input, itemStyles.inputPartial, { minWidth: 92, maxWidth: 92, marginHorizontal: 12 }]}>
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
                  right={<TextInput.Affix text={parseInt(editedHabit.points) === 1 ? 'pt' : 'pts'} />}
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
                    setEditedHabit({ ...editedHabit, points: num.toString() });
                    setIsPointsMenuVisible(false);
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
  ) : <></>;
};

const createItemStyles = (theme: MD3Theme) => StyleSheet.create({
  item: {
    marginBottom: 8,
    borderRadius: 8,
  },
  itemCollapsed: {
    height: 92,
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
    paddingHorizontal: 4,
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
    marginLeft: 8,
  },
  measurement: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  measurementIcon: {
    marginTop: 3,
    marginRight: 4
  },
  measurementActivity: {
    lineHeight: 24,
  },
  measurementVariant: {
    color: theme.colors.outline,
    lineHeight: 24,
  },
  habitOperator: {
    marginLeft: 2,
    lineHeight: 28,
  },
  habitDaily: {
    lineHeight: 28,
    fontWeight: 900,
  },
  measurementUnit: {
    lineHeight: 28,
    fontWeight: 900,
    
  },
  points: {
    width: 48,
    height: 28,
    flexDirection: 'row',
    marginVertical: 6,
    marginRight: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  pointsText: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.onPrimary,
    marginRight: 4,
  },
  pointsIcon: {
    marginTop: 2,
  },
  daysPerWeek: {
    marginTop: 6,
    marginRight: -18,
  },
  daysPerWeekMultiply: {
    marginTop: 8,
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
    dispatch(addHabit(createHabit(user.id, measurement.id, 'New habit', '>', 0)));
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