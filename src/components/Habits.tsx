import { Fragment, useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useHabits, useMeasurement, useMeasurements, useUser } from "@/store/selectors";
import { editHabit, removeHabit, addHabit, addMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { createHabit, habitOperatorData, type Habit, type HabitOperator } from "@/types/habits";
import { Button, Icon, IconButton, Menu, Surface, Text, TextInput, AnimatedFAB, FAB, useTheme as usePaperTheme, Chip, Divider, useTheme, type MD3Theme, Modal, List, TouchableRipple, SegmentedButtons } from 'react-native-paper';
import { formatNumber, forWeb } from '@u/helpers';
import { createMeasurement, measurementTypeData } from '@t/measurements';
import { EmptyError, NoError, Error } from '@u/constants/Errors';

type EditedHabit = {
  id: string;
  userId: string;
  name: string;
  measurementId: string;
  operator: HabitOperator;
  target: string;
  isWeekly: boolean;
  points: string;
  daysPerWeek: string;
  archived: boolean;
};

const Habits = () => {
  const dispatch = useDispatch();
  const habits = useHabits();
  const user = useUser();
  const measurements = useMeasurements();

  const theme = useTheme();
  const formStyles = createFormStyles(theme);

  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState<EditedHabit | null>(null);
  const [editedHabit, setEditedHabit] = useState<EditedHabit | null>(null);

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
  const handleArchiveHabit = (habit: Habit, archived: boolean) => {
    dispatch(editHabit({
      id: habit.id,
      updates: { ...habit, archived },
    }));
  };

  const handleAddHabit = (newHabit: Habit) => {
    dispatch(addHabit(newHabit));
    setTimeout(() => {
      scrollToEnd();
    }, 0);
  }

  const getInitialEditedHabit = (habit: Habit) => ({
    ...habit,
    target: habit.target?.toString(),
    daysPerWeek: habit.daysPerWeek?.toString(),
    points: habit.points?.toString(),
  });

  const handleAddHabitPress = () => {
    let measurement = measurements.length ? measurements[0] : null;
    if (!measurement) {
      measurement = createMeasurement(user.id, 'New measurement', 'New variant', 'duration', 'min', 15);
      dispatch(addMeasurement(measurement));
    }
    
    setShowForm(true);
    setNewHabit(getInitialEditedHabit(createHabit(user.id, measurement.id, 'New habit', '>', 0)));
  }

  const handleHabitPress = (habit: Habit) => {
    setShowForm(true);
    setEditedHabit(getInitialEditedHabit(habit));
  }

  const hideForm = () => {
    setShowForm(false);
    setTimeout(() => {
      setNewHabit(null);
      setEditedHabit(null);
    }, 250);
  }

  const [isMeasurementMenuVisible, setIsMeasurementMenuVisible] = useState(false);
  const [isOperatorMenuVisible, setIsOperatorMenuVisible] = useState(false);
  const [isDaysPerWeekMenuVisible, setIsDaysPerWeekMenuVisible] = useState(false);
  const [isPointsMenuVisible, setIsPointsMenuVisible] = useState(false);
  const renderForm = () => {
    const isNew = !!newHabit;
    const formHabit = newHabit || editedHabit || null;
    const formMeasurement = useMeasurement(formHabit?.measurementId || '');
    if (formHabit === null || !formMeasurement) return;

    const handleFormEdit = (nextHabit: EditedHabit) => {
      if (isNew) setNewHabit(nextHabit);
      else setEditedHabit(nextHabit);
    }
  
    const handleSave = () => {
      if (hasErrors()) return;
    
      const nextHabit = {
        ...formHabit,
        name: formHabit.name.trim(),
        target: parseInt(formHabit.target) || 0,
        daysPerWeek: formHabit.daysPerWeek ? parseInt(formHabit.daysPerWeek) : 7,
        points: formHabit.points ? parseInt(formHabit.points) : 1,
      };

      if (isNew) handleAddHabit(nextHabit);
      else handleEditHabit(nextHabit);

      hideForm();
    };
    
    const handleCancel = () => {
      hideForm()
    }
  
    const hasErrors = () => {
      if (getNameErrors().hasError) return true;
      if (getTargetErrors().hasError) return true;
      return false
    }
  
    const getNameErrors = () => {
      if (!formHabit.name || !formHabit.name.trim()) return EmptyError;
      return NoError;
    }
  
    const getTargetErrors = () => {
      if (isBool) return NoError;
      if (!formHabit.target) return EmptyError;
      const target = parseFloat(formHabit.target);
      if (isNaN(target) || !isFinite(target) || target < 0) return Error('Invalid target');
      return NoError;
    }

    const isBool = formMeasurement.type === 'bool';
    const unit = formMeasurement.unit || '';
    const typeData = measurementTypeData.find((data) => data.type === formMeasurement.type) || measurementTypeData[0];

    return (
      <>
        <View style={formStyles.header}>
          <Text variant='titleLarge' style={formStyles.title} >{`${isNew ? 'Create' : 'Edit'} habit`}</Text>
          <IconButton style={formStyles.closeButton} icon={'window-close'} onPress={() => hideForm() } />
        </View>
        <SegmentedButtons
          style={formStyles.scopeButtons}
          value={formHabit.isWeekly ? 'weekly' : 'daily'}
          onValueChange={(value) => {
            const nextHabit = { ...formHabit, isWeekly: value === 'weekly' };
            handleFormEdit(nextHabit);
          }}
          buttons={[
            {
              value: 'daily',
              label: 'Daily',
              icon: 'sync',
              style: formStyles.scopeButton,
              labelStyle: formStyles.scopeButtonLabel,
            },
            {
              value: 'weekly',
              label: 'Weekly',
              icon: 'calendar-sync',
              style: formStyles.scopeButton,
              labelStyle: formStyles.scopeButtonLabel,
            }
          ]}
        />
        <TextInput
          label="Name"
          mode='outlined'
          style={formStyles.input}
          value={formHabit.name || ' '}
          onChangeText={(text) => {
            const nextHabit = { ...formHabit, name: text };
            handleFormEdit(nextHabit);
          }}
        />
        <View style={{ ...formStyles.input }}>
          <Menu
            style={{ maxWidth: 600 }}
            contentStyle={{ maxWidth: 600 }}
            visible={isMeasurementMenuVisible}
            onDismiss={() => setIsMeasurementMenuVisible(false)}
            anchor={
              <Pressable onPress={() => { setIsMeasurementMenuVisible(true); }}>
                <TextInput
                  mode='outlined'
                  style={formStyles.inputDropdown}
                  label="Measurement"
                  readOnly
                  value={`${formMeasurement.activity}${formMeasurement.variant ? ` : ${formMeasurement.variant}` : ''}`}
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
                    const nextHabit = { ...formHabit, measurementId: measurement.id };
                    if (measurement.type === 'bool') {
                      nextHabit.operator = '>';
                      nextHabit.target = '0';
                    }

                    handleFormEdit(nextHabit);
                    setIsMeasurementMenuVisible(false);
                  }}
                />
              ))
            }
          </Menu>
        </View>
        <View style={{ ...formStyles.formRow, marginBottom: 32 }}>
          {/* <View style={formStyles.typeIcon}>
            <Icon source={typeData.icon} size={24} />
          </View> */}
          <View style={formStyles.inputPartial}>
            <Menu
              visible={isOperatorMenuVisible}
              onDismiss={() => setIsOperatorMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => { setIsOperatorMenuVisible(true); }}
                  disabled={isBool}
                >
                  <TextInput
                    mode='outlined'
                    style={formStyles.inputDropdown}
                    label="Operator"
                    readOnly
                    value={isBool ? '--' : formHabit.operator}
                    disabled={isBool}
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
                    const nextHabit = { ...formHabit, operator };
                    handleFormEdit(nextHabit);
                    setIsOperatorMenuVisible(false);
                  }}
                  />
                ))
              }
            </Menu>
          </View>
          <TextInput
            label="Target"
            mode='outlined'
            style={{ ...formStyles.input, flex: 2}}
            error={!!getTargetErrors().hasError}
            value={isBool ? '--' : formHabit.target?.toString()}
            onChangeText={(text) => {
              const nextHabit = { ...formHabit, target: text };
              handleFormEdit(nextHabit);
            }}
            right={<TextInput.Affix text={unit || ''} />}
            keyboardType="numeric"
            disabled={isBool}
          />
        </View>
        <View style={formStyles.formRow}>
          {/* <Button
            style={formStyles.weeklyButton}
            mode={!formHabit.isWeekly ? 'contained-tonal' : 'text'}
            compact
            icon={'sync'}
            onPress={() => {
              const nextHabit = { ...formHabit, isWeekly: false };
              handleFormEdit(nextHabit);
            }}
          >
            <Text style={formStyles.weeklyButtonText} variant='titleMedium'>
              Daily
            </Text>
          </Button>
          <Button
            style={formStyles.weeklyButton}
            mode={formHabit.isWeekly ? 'contained-tonal' : 'text'}
            compact
            icon={'calendar-sync'}
            onPress={() => {
              const nextHabit = { ...formHabit, isWeekly: true };
              handleFormEdit(nextHabit);
            }}
          >
            <Text style={formStyles.weeklyButtonText} variant='titleMedium'>
              Weekly
            </Text>
          </Button> */}
        </View>
        <View style={formStyles.formRow}>
          <View style={formStyles.inputPartial}>
            <Menu
              visible={isDaysPerWeekMenuVisible}
              onDismiss={() => setIsDaysPerWeekMenuVisible(false)}
              anchor={
                <Pressable onPress={() => { setIsDaysPerWeekMenuVisible(true); }}>
                  <TextInput
                    mode='outlined'
                    style={formStyles.inputDropdown}
                    label="Frequency"
                    readOnly
                    value={formHabit.isWeekly ? '--' : formHabit.daysPerWeek}
                    right={<TextInput.Affix text="/week" />}
                    disabled={formHabit.isWeekly}
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
                    const nextHabit = { ...formHabit, daysPerWeek: num.toString() };
                    handleFormEdit(nextHabit);
                    
                    setIsDaysPerWeekMenuVisible(false);
                  }}
                  />
                ))
              }
            </Menu>
          </View>
          <View style={{ ...formStyles.input, flex: 2}}>
            <Menu
              visible={isPointsMenuVisible}
              onDismiss={() => setIsPointsMenuVisible(false)}
              anchor={
                <Pressable onPress={() => { setIsPointsMenuVisible(true); }}>
                  <TextInput
                    style={formStyles.inputDropdown}
                    label="Points"
                    mode='outlined'
                    readOnly
                    value={formHabit.points}
                    right={<TextInput.Affix text={parseInt(formHabit.points) === 1 ? 'point' : 'points'} />}
                  />
                </Pressable>
              }
              anchorPosition='bottom'
            >
              {
                [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Menu.Item
                    key={num}
                    title={num}
                    onPress={() => {
                      const nextHabit = { ...formHabit, points: num.toString() };
                      handleFormEdit(nextHabit);

                      setIsPointsMenuVisible(false);
                    }}
                  />
                ))
              }
            </Menu>
          </View>
        </View>
        <View style={formStyles.buttons}>
          <Button
            mode="contained-tonal"
            style={formStyles.button}
            labelStyle={formStyles.buttonLabel}
            onPress={() => handleSave()}
            disabled={hasErrors()}
          >
            <Text variant='labelLarge' style={formStyles.buttonText}>Save</Text>
          </Button>
          <Button
            mode="contained-tonal"
            style={formStyles.button}
            labelStyle={formStyles.buttonLabel}
            onPress={() => handleCancel()}
          >
            <Text variant='labelLarge' style={formStyles.buttonText}>Cancel</Text>
          </Button>
        </View>
      </>
    );
  }

  const activeHabits = habits.filter(({ archived, isWeekly: weekly }) => !archived);
  const weeklyHabits = habits.filter(({ archived, isWeekly: weekly }) => !archived && weekly);
  const archivedHabits = habits.filter(({ archived }) => archived);

  const [showActiveOverride, setShowActiveOverride] = useState(0);
  const showActiveHabits = showActiveOverride !== -1;
  const [showDailyOverride, setShowDailyOverride] = useState(0);
  const showDailyHabits = showDailyOverride !== -1;
  const [showWeeklyOverride, setShowWeeklyOverride] = useState(0);
  const showWeeklyHabits = showWeeklyOverride !== -1;
  const [showArchivedOverride, setShowArchivedOverride] = useState(0);
  const showArchivedHabits = showArchivedOverride === 1;

  const listStyles = createListStyles(theme);
  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer} onScroll={handleScroll} scrollEventThrottle={64}>
        <View style={listStyles.habitsContainer}>
          <List.Accordion
            title={
              <>
              <View style={listStyles.sectionHeaderTitle}>
                <View style={listStyles.sectionHeaderTitleIcon}>
                  <Icon source='sync' size={18} color={theme.colors.primary} />
                </View>
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'> / </Text>
                <View style={listStyles.sectionHeaderTitleIcon}>
                  <Icon source='calendar-sync' size={18} color={theme.colors.primary} />
                </View>
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Active${showActiveHabits ? '' : ` (${activeHabits.length})`}`}</Text>
              </View>
              </>
            }
            expanded={showActiveHabits}
            onPress={() => setShowActiveOverride(showActiveHabits ? -1 : 1)}
            style={listStyles.sectionHeader}
            right={() => (
              <View style={listStyles.sectionHeaderIcon}>
                <Icon source={showActiveHabits ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.primary} />
              </View>
            )}
            >
            {showActiveHabits ? (
              <>
                {activeHabits.length ? (
                  activeHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      onPress={handleHabitPress}
                      onArchive={handleArchiveHabit}
                      onDelete={handleDeleteHabit}
                    />
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source='alert-circle-outline' size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No active habits</Text>
                  </View>
                )}
              </>
            ) : null}
          </List.Accordion>
          {/* <List.Accordion
            title={
              <View style={listStyles.sectionHeaderTitle}>
                <View style={listStyles.sectionHeaderTitleIcon}>
                  <Icon source='calendar-sync' size={18} color={theme.colors.primary} />
                </View>
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Weekly${showWeeklyHabits ? '' : ` (${weeklyHabits.length})`}`}</Text>
              </View>
            }
            expanded={showWeeklyHabits}
            onPress={() => setShowWeeklyOverride(showWeeklyHabits ? -1 : 1)}
            style={listStyles.sectionHeader}
            right={() => (
              <View style={listStyles.sectionHeaderIcon}>
                <Icon source={showWeeklyHabits ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.primary} />
              </View>
            )}
            >
            {showWeeklyHabits ? (
              <>
                {weeklyHabits.length ? (
                  weeklyHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      onPress={handleHabitPress}
                      onArchive={handleArchiveHabit}
                      onDelete={handleDeleteHabit}
                    />
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source='alert-circle-outline' size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No weekly habits</Text>
                  </View>
                )}
              </>
            ) : null}
          </List.Accordion> */}
          <List.Accordion
            title={
              <View style={listStyles.sectionHeaderTitle}>
                <View style={listStyles.sectionHeaderTitleIcon}>
                  <Icon source='archive-outline' size={18} color={theme.colors.primary} />
                </View>
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Archived${showArchivedHabits ? '' : ` (${archivedHabits.length})`}`}</Text>
              </View>
            }
            expanded={showArchivedHabits}
            onPress={() => setShowArchivedOverride(showArchivedHabits ? -1 : 1)}
            style={listStyles.sectionHeader}
            titleStyle={listStyles.sectionHeaderText}
            right={() => (
              <View style={listStyles.sectionHeaderIcon}>
                <Icon source={showArchivedHabits ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.primary} />
              </View>
            )}
            >
            {showArchivedHabits ? (
              <>
                {archivedHabits.length ? (
                  archivedHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      onPress={handleHabitPress}
                      onArchive={handleArchiveHabit}
                      onDelete={handleDeleteHabit}
                    />
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source='alert-circle-outline' size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No archived habits</Text>
                  </View>
                )}
              </>
            ) : null}
          </List.Accordion>
        </View>
      </ScrollView>
      <View style={listStyles.createButtonContainer}>
        <Button
          style={listStyles.createButton}
          onPress={() => handleAddHabitPress()}
          icon='checkbox-marked-outline'
          mode='elevated'
          buttonColor={theme.colors.secondaryContainer}
          contentStyle={{ height: 56}}
        >
          <Text variant='labelLarge' style={listStyles.createButtonText}>Create habit</Text>  
        </Button>
      </View>
      <Modal
        visible={!!showForm}
        onDismiss={() => {
          hideForm();
        }}
        contentContainerStyle={formStyles.container}
        dismissable={false}
      >
        {renderForm()}
      </Modal>
    </View>
  );
};

const createListStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 0,
    flex: 1,
  },
  habitsContainer: {
    paddingBottom: 88,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: theme.colors.elevation.level3,
  },
  sectionHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectionHeaderTitleIcon: {

  },
  sectionHeaderText: {
    color: theme.colors.primary,
  },
  sectionHeaderIcon: {
    marginRight: 8,
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: '100%',
    padding: 16,
  },
  createButton: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
  },
  createButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  noData: {
    flexDirection: 'row',
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: theme.colors.outline,
  },
  noDataIcon: {
    marginRight: 8,
  },
})

const createFormStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 12,
    // backgroundColor: theme.colors.elevation.level0,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    lineHeight: 40,
  },
  closeButton: {
    margin: 0,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  input: {
    marginBottom: 16,
    // backgroundColor: theme.colors.elevation.level3,
  },
  inputPartial: {
    flex: 1,
  },
  inputDropdown: {
    // backgroundColor: theme.colors.elevation.level3,
  },
  typeIcon: {
    height: 56,
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    
    backgroundColor: theme.colors.elevation.level3,
  },
  weeklyButton: {
    
  },
  weeklyButtonText: {
    
  },
  scopeButtons: {
    marginBottom: 16,
  },
  scopeButton: {
    // borderWidth: 0,
    
  },
  scopeButtonLabel: {

  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 32,
  },
  button: {
    borderRadius: 40,
  },
  buttonLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,

  },
  buttonText: {
    color: theme.colors.primary,
  },
})

const HabitItem = ({ habit, onPress, onArchive, onDelete }: {
  habit: Habit;
  onPress: (habit: Habit) => void;
  onArchive: (habit: Habit, archived: boolean) => void;
  onDelete: (habit: Habit) => void;
}): JSX.Element | null => {

const measurement = useMeasurement(habit.measurementId);

const theme = useTheme();
const itemStyles = createItemStyles(theme);

const [isMenuVisible, setIsMenuVisible] = useState(false);

const operatorData = habitOperatorData.find((data) => data.operator === habit.operator) || habitOperatorData[0];
const typeData = measurementTypeData.find((data) => data.type === measurement?.type) || measurementTypeData[0];
return measurement ? (
  <TouchableRipple style={itemStyles.container} onPress={() => onPress(habit)}>
    <>
      <View style={itemStyles.content}>
        <View style={itemStyles.header}>
          <Text variant='titleMedium' ellipsizeMode='tail' numberOfLines={1}  style={itemStyles.name}>{habit.name}</Text>
          {/* {habit.isWeekly ? null : (
            <>
            <View style={itemStyles.frequencyDivider}>
            <Icon source='close' size={14} />
            </View>
            <Text variant='bodyLarge' style={itemStyles.frequencyValue}>{habit.daysPerWeek}</Text>
            </>
            )} */}
        </View>
        {/* <View style={itemStyles.daysPerWeek}>
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
          </View> */}
        <View style={itemStyles.description}>
          <View style={itemStyles.measurement}>
            <Icon source={typeData.icon} size={16} />
            <Text numberOfLines={1} variant='titleSmall' style={itemStyles.measurementActivity}> {measurement.activity}</Text>
            {measurement.variant ? <Text numberOfLines={1} variant='bodyMedium' style={itemStyles.measurementVariant}> : {measurement.variant}</Text> : null}
          </View>
          {measurement.type !== 'bool' && (
            <>
              <Text variant='bodyMedium' style={itemStyles.habitOperator}> {operatorData.label.toLowerCase()} </Text>
              <Text variant='bodyMedium' style={itemStyles.habitDaily}>{formatNumber(habit.target)}</Text>
              <Text variant='bodyMedium' style={itemStyles.measurementUnit}> {measurement.unit}</Text>
              <Text variant='bodyMedium' style={itemStyles.habitScope}> / </Text>
              <Text variant='bodyMedium' style={itemStyles.habitScope}>{habit.isWeekly ? 'week' : 'day'} </Text>
              <Icon source={habit.isWeekly ? 'calendar-sync' : 'sync'} size={16} />
              </>
          )}
        </View>
      </View>
      <View style={itemStyles.points}>
        {/* <View style={itemStyles.pointsIcon}>
          <Icon source={'dots-triangle'} size={28} color={theme.colors.primary} />
        </View> */}
        <Text variant='titleSmall' style={itemStyles.pointsValue}>{habit.points * (habit.isWeekly ? 1 : habit.daysPerWeek)}</Text>
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
          <Menu.Item
            leadingIcon='archive-outline'
            onPress={() => { onArchive(habit, !habit.archived); }}
            title={habit.archived ? 'Unarchive' : 'Archive'}
          />
          <Menu.Item
            leadingIcon='delete-outline'
            onPress={() => { onDelete(habit); }}
            title="Delete"
          />
        </Menu>
    </>
  </TouchableRipple>
) : null;
};

const createItemStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  leftIcon: {
    marginRight: 8,
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 0,
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  name: {
  },
  pointsValue: {
    fontWeight: 'bold',
    color: theme.colors.onPrimary,  
  },
  points: {
    width: 28,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    backgroundColor: theme.colors.primary,
  },
  // pointsIcon: {
  //   position: 'absolute',
  //   right: -13,
  //   top: 4,
  // },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurement: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  measurementIcon: {
  },
  measurementActivity: {
    marginLeft: 4,

  },
  measurementVariant: {
    color: theme.colors.outline,
  },
  habitOperator: {
    marginLeft: 2,
  },
  habitDaily: {
    fontWeight: 'bold',
  },
  measurementUnit: {
    fontWeight: 'bold',
  },
  habitScope: {
    fontWeight: 'bold',
  },
});

export default Habits;