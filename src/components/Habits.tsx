import { useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useHabits, useMeasurements, useMeasurementsByIds, useUser } from "@/store/selectors";
import { editHabit, removeHabit, addHabit, addMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { createHabit, getHabitPredicateIcon, getHabitPredicateLabel, habitOperators, getHabitOperatorData, type Habit, type HabitOperator, getHabitOperatorLabel } from "@/types/habits";
import { Button, Icon, IconButton, Menu, Text, TextInput, useTheme, type MD3Theme, Modal, List, TouchableRipple, SegmentedButtons } from 'react-native-paper';
import { formatNumber, formatTime } from '@u/helpers';
import { createMeasurement, getMeasurementTypeData } from '@t/measurements';
import { EmptyError, NoError } from '@u/constants/Errors';
import Points from '@c/Points';

type EditedHabit = {
  id: string;
  userId: string;
  name: string;
  isWeekly: boolean;
  points: string;
  daysPerWeek: string;
  archived: boolean;
  conditions: EditedHabitCondition[],
  predicate: string,
};

type EditedHabitCondition = {
  measurementId: string;
  operator: HabitOperator;
  target: string;
}

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
    daysPerWeek: habit.daysPerWeek?.toString(),
    points: habit.points?.toString(),
    conditions: habit.conditions.map((condition) => ({
      ...condition,
      target: condition.target?.toString(),
    })),
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

  const [measurementMenuVisibilities, setMeasurementMenuVisibilities] = useState<boolean[]>([]);
  const [operatorMenuVisibilities, setOperatorMenuVisibilities] = useState<boolean[]>([]);
  const [isDaysPerWeekMenuVisible, setIsDaysPerWeekMenuVisible] = useState(false);
  const [isPointsMenuVisible, setIsPointsMenuVisible] = useState(false);
  const renderForm = () => {
    const isNew = !!newHabit;
    const formHabit = newHabit || editedHabit || null;
    const formMeasurementIds = formHabit?.conditions.map(({ measurementId }) => measurementId) || [];
    const formMeasurements = useMeasurementsByIds(formMeasurementIds);
    
    if (formHabit === null || !formMeasurements.length) return;
    const unusedMeasurements = measurements.filter((m) => !formHabit.conditions.find(({ measurementId }) => m.id === measurementId));

    const handleFormEdit = (nextHabit: EditedHabit) => {
      if (isNew) setNewHabit(nextHabit);
      else setEditedHabit(nextHabit);
    }
  
    const handleSave = () => {
      if (hasErrors()) return;
    
      const nextHabit = {
        ...formHabit,
        name: formHabit.name.trim(),
        daysPerWeek: formHabit.daysPerWeek ? parseInt(formHabit.daysPerWeek) : 7,
        points: formHabit.points ? parseInt(formHabit.points) : 1,
        conditions: formHabit.conditions.map((condition) => ({
          ...condition,
          target: parseFloat(condition.target) || 0,
        })),
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

      // if (isBool) return NoError;
      // if (formHabit.conditions.find(({ target }) => !target)) return EmptyError;

      // if (formHabit.conditions.find((condition) => {
      //   const target = parseFloat(condition.target);
      //   return (isNaN(target) || !isFinite(target) || target < 0);
      // })) {
      //   return Error('Invalid target');
      // }

      return NoError;
    }

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
        <View style={formStyles.formRow}>
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
          <View style={formStyles.inputPartial}>
            <Menu
              visible={isPointsMenuVisible}
              onDismiss={() => setIsPointsMenuVisible(false)}
              anchor={
                <Pressable onPress={() => { setIsPointsMenuVisible(true); }}>
                  <TextInput
                    style={formStyles.inputDropdown}
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
        <View style={formStyles.conditions}>
          <Button
            style={formStyles.addConditionButton}
            labelStyle={formStyles.addConditionButtonLabel}
            mode='text'
            onPress={() => {
              const nextHabit = { ...formHabit };
              const m = unusedMeasurements.length ? unusedMeasurements[0] : measurements[0];
              nextHabit.conditions.push({
                measurementId: m.id,
                operator: '>=',
                target: '0',
              })
              handleFormEdit(nextHabit);
            }}
          >
            <Icon source={'plus'} size={14} color={theme.colors.primary} />
            Add condition
          </Button>
          <SegmentedButtons
            style={formStyles.predicateButtons}
            value={formHabit.predicate}
            density='small'
            onValueChange={(value) => {
              const nextHabit = { ...formHabit, predicate: value };
              handleFormEdit(nextHabit);
            }}
            buttons={[
              {
                value: 'AND',
                label: 'All',
                icon: getHabitPredicateIcon('AND'),
                style: formStyles.predicateButton,
                labelStyle: formStyles.predicateButtonLabel,
              },
              {
                value: 'OR',
                label: 'Any',
                icon: getHabitPredicateIcon('OR'),
                style: formStyles.predicateButton,
                labelStyle: formStyles.predicateButtonLabel,
              }
            ]}
          />
          {formHabit.conditions.map((condition, index) => {
            const formMeasurement = formMeasurements[index];
            if (!formMeasurement) return;

            const typeData = getMeasurementTypeData(formMeasurement.type);

            const isBool = formMeasurement.type === 'bool';
            const isTime = formMeasurement.type === 'time';
            const isMeasurementMenuVisible = measurementMenuVisibilities[index];
            const isOperatorMenuVisible = operatorMenuVisibilities[index];

            return (
              <View key={index} style={formStyles.condition}>
                <View style={{ flexShrink: 1 }}>
                  <Menu
                    style={{ maxWidth: 600 }}
                    contentStyle={{ maxWidth: 600 }}
                    visible={isMeasurementMenuVisible}
                    onDismiss={() => {
                      const nextVisibilities = [...measurementMenuVisibilities];
                      nextVisibilities[index] = false;
                      setMeasurementMenuVisibilities(nextVisibilities);
                    }}
                    anchor={
                      <TouchableRipple
                        style={formStyles.dropdownButton}
                        // labelStyle={formStyles.dropdownButtonLabel}
                        // mode='contained-tonal'
                        // compact
                        onPress={() => {
                          const nextVisibilities = [...measurementMenuVisibilities];
                          nextVisibilities[index] = true;
                          setMeasurementMenuVisibilities(nextVisibilities);
                        }}
                      >
                        <>
                          <Icon source={typeData.icon} size={16} />
                          <Text ellipsizeMode='tail' variant='titleSmall' numberOfLines={1} style={formStyles.measurementActivity}>
                            {formMeasurement.activity}
                          </Text>
                          {formMeasurement.variant ? <Text ellipsizeMode='tail'  numberOfLines={1} variant='bodyMedium' style={formStyles.measurementVariant}> : {formMeasurement.variant}</Text> : null}
                        </>
                      </TouchableRipple>
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
                          leadingIcon={getMeasurementTypeData(measurement.type).icon}
                          onPress={() => {
                            const nextHabit = { ...formHabit };
                            nextHabit.conditions[index].measurementId = measurement.id;
                            if (measurement.type === 'bool') {
                              nextHabit.conditions[index].operator = '>';
                              nextHabit.conditions[index].target = '0';
                            }

                            handleFormEdit(nextHabit);
                            const nextVisibilities = [...measurementMenuVisibilities];
                            nextVisibilities[index] = false;
                            setMeasurementMenuVisibilities(nextVisibilities);
                          }}
                        />
                      ))
                    }
                  </Menu>
                </View>
                {formMeasurement.type !== 'bool' ? (
                  <>
                    <Menu
                      visible={isOperatorMenuVisible}
                      onDismiss={() => {
                        const nextVisibilities = [...operatorMenuVisibilities];
                        nextVisibilities[index] = false;
                        setOperatorMenuVisibilities(nextVisibilities);
                      }}
                      anchor={
                        <TouchableRipple
                          style={formStyles.dropdownButton}
                          // labelStyle={formStyles.dropdownButtonLabel}
                          // mode='contained-tonal'
                          // compact
                          onPress={() => {
                            const nextVisibilities = [...operatorMenuVisibilities];
                            nextVisibilities[index] = true;
                            setOperatorMenuVisibilities(nextVisibilities);
                          }}
                          disabled={isBool}
                        >
                          <Text variant='titleSmall'>
                            {condition.operator}
                          </Text>
                        </TouchableRipple>
                      }
                      anchorPosition='bottom'
                    >
                      {
                        habitOperators.map((operator) => {
                          const { icon, label, timeLabel } = getHabitOperatorData(operator);
                          return (
                            <Menu.Item
                              key={operator}
                              title={formMeasurement.type === 'time' ? timeLabel : label}
                              leadingIcon={icon}
                              onPress={() => {
                                const nextHabit = { ...formHabit };
                                nextHabit.conditions[index].operator = operator;
                                handleFormEdit(nextHabit);
                                
                                const nextVisibilities = [...operatorMenuVisibilities];
                                nextVisibilities[index] = false;
                                setOperatorMenuVisibilities(nextVisibilities);
                              }}
                            />
                          );
                        })
                      }
                    </Menu>
                    <TextInput
                      mode='outlined'
                      style={formStyles.targetInput}
                      contentStyle={formStyles.targetInputContent}
                      dense
                      placeholder='0'
                      error={!!getTargetErrors().hasError}
                      value={isBool ? '--' : condition.target.toString()}
                      onChangeText={(text) => {
                        const nextHabit = { ...formHabit };
                        nextHabit.conditions[index].target = text;
                        handleFormEdit(nextHabit);
                      }}
                      right={<TextInput.Affix text={isTime ? `(${formatTime(parseFloat(condition.target || '0'))})` : (formMeasurement.unit || '')} />}
                      keyboardType="numeric"
                      disabled={isBool}
                    />
                  </>
                ) : null}
                {formHabit.conditions.length > 1 ? (
                  <IconButton
                    icon={'delete-outline'}
                    style={formStyles.deleteButton}
                    size={20}
                    onPress={() => {
                      const nextHabit = { ...formHabit };
                      nextHabit.conditions.splice(index, 1);
                      handleFormEdit(nextHabit);
                    }}
                  />
                ) : null}
              </View>
            )
          })}
        </View>
        <View style={formStyles.buttons}>
          <Button
            mode="text"
            style={formStyles.button}
            labelStyle={formStyles.buttonLabel}
            onPress={() => handleCancel()}
          >
            <Text variant='labelLarge' style={formStyles.buttonText}>Cancel</Text>
          </Button>
          <Button
            mode="contained-tonal"
            style={formStyles.button}
            labelStyle={formStyles.buttonLabel}
            onPress={() => handleSave()}
            disabled={hasErrors()}
          >
            <Text variant='labelLarge' style={formStyles.buttonText}>Save</Text>
          </Button>
        </View>
      </>
    );
  }

  const activeHabits = habits.filter(({ archived, isWeekly: weekly }) => !archived);
  const archivedHabits = habits.filter(({ archived }) => archived);

  const [showActiveOverride, setShowActiveOverride] = useState(0);
  const showActiveHabits = showActiveOverride !== -1;
  const [showArchivedOverride, setShowArchivedOverride] = useState(0);
  const showArchivedHabits = showArchivedOverride === 1;

  const listStyles = createListStyles(theme);
  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer}>
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
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: theme.colors.secondaryContainer,
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
    marginBottom: 12,
  },
  input: {
    flex: 1,
  },
  inputPartial: {
    flex: 1,
  },
  inputDropdown: {
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
  conditions: {
    marginTop: 4,
    gap: 12
  },
  condition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  dropdownButton: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    borderRadius: 4,
    flexShrink: 1,
  },
  dropdownButtonLabel: {
    marginVertical: 10,
    marginHorizontal: 12,
    borderRadius: 4,
    flexShrink: 1,
  },
  measurementActivity: {
    marginLeft: 4,
    flexShrink: 2,
  },
  measurementVariant: {
    color: theme.colors.outline,
    flexShrink: 1,
  },
  targetInput: {
    flex: 1,
    minWidth: 120,
    padding: 0,
    height: 40,
  },
  targetInputContent: {
    margin: 0,
    padding: 0,
  },
  addConditionButton: {
    marginTop: 8,
  },
  addConditionButtonLabel: {
  },
  predicateButtons: {
    
  },
  predicateButton: {
    
  },
  predicateButtonLabel: {
    
  },
  deleteButton: {
    margin: 0,
  },
})

const HabitItem = ({ habit, onPress, onArchive, onDelete }: {
  habit: Habit;
  onPress: (habit: Habit) => void;
  onArchive: (habit: Habit, archived: boolean) => void;
  onDelete: (habit: Habit) => void;
}): JSX.Element | null => {

const measurements = useMeasurementsByIds(habit.conditions.map(({ measurementId }) => measurementId ));

const theme = useTheme();
const itemStyles = createItemStyles(theme);

const [isMenuVisible, setIsMenuVisible] = useState(false);

return measurements.length ? (
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
        {habit.conditions.length > 1 ? (
            <View style={itemStyles.predicateContainer}>
              <Icon source={getHabitPredicateIcon(habit.predicate)} size={12} color={theme.colors.outline} />
              <Text variant='titleSmall' ellipsizeMode='tail' numberOfLines={1} style={itemStyles.predicate}>{getHabitPredicateLabel(habit.predicate)}</Text>
            </View>
          ) : null}
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
        {habit.conditions.map((condition, index) => {
          const measurement = measurements[index];
          if (!measurement) return null;

          const isBool = measurement.type === 'bool';
          const isTime = measurement.type === 'time';
          const isCountable = !isBool && !isTime;

          const operatorLabel = getHabitOperatorLabel(condition.operator, measurement.type).toLowerCase();
          const typeData = getMeasurementTypeData(measurement.type);

          let conditionLabel = null;
          if (isTime) {
            conditionLabel = (
              <>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.habitOperator}> {operatorLabel} </Text>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.habitDaily}>{formatTime(condition.target)}</Text>
                <Icon source={habit.isWeekly ? 'calendar-sync' : 'sync'} size={16} />
              </>
            )
          } else if (isCountable) {
            conditionLabel = (
              <>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.habitOperator}> {operatorLabel} </Text>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.habitDaily}>{formatNumber(condition.target)}</Text>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.measurementUnit}> {measurement.unit}</Text>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.habitScope}> / </Text>
                <Text variant='bodyMedium' numberOfLines={1} style={itemStyles.habitScope}>{habit.isWeekly ? 'week' : 'day'} </Text>
                <Icon source={habit.isWeekly ? 'calendar-sync' : 'sync'} size={16} />
              </>
            )
          }
          return (
            <View key={index} style={itemStyles.description}>
              <View style={itemStyles.measurement}>
                <Icon source={typeData.icon} size={16} />
                <Text numberOfLines={1} ellipsizeMode='tail' variant='titleSmall' style={itemStyles.measurementActivity}>
                  {measurement.activity}
                </Text>
                {measurement.variant ? <Text numberOfLines={1} ellipsizeMode='tail' variant='bodyMedium' style={itemStyles.measurementVariant}> : {measurement.variant}</Text> : null}
              </View>
              {conditionLabel}
            </View>
          )
        })}
      </View>
      <View style={habit.conditions.length === 1 ? itemStyles.rightContainerCentered : itemStyles.rightContainer}>
        <View style={itemStyles.rightContainerInner}>
          <Points points={habit.points * (habit.isWeekly ? 1 : habit.daysPerWeek)} />
          <Text>/ week</Text>
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
        </View>
      </View>
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
  },
  name: {
  },
  predicateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predicate: {
    color: theme.colors.outline,
    marginLeft: 4,
  },
  rightContainer: {
    height: '100%',
  },
  rightContainerCentered: {
    height: '100%',
    justifyContent: 'center',
  },
  rightContainerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    gap: 4,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'nowrap',
    gap: 4,
  },
  measurement: {
    flexShrink: 1,
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
    flexShrink: 0,
    marginLeft: 2,
  },
  habitDaily: {
    flexShrink: 0,
    fontWeight: 'bold',
  },
  measurementUnit: {
    flexShrink: 0,
    fontWeight: 'bold',
  },
  habitScope: {
    flexShrink: 0,
    fontWeight: 'bold',
  },
});

export default Habits;