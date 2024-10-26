import { useRef, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import { useComputedHabits, useMeasurements, useMeasurementsByIds } from "@/store/selectors";
import { useDispatch } from "react-redux";
import { getHabitPredicateIcon, getHabitPredicateLabel, type ComputedHabit, getHabitOperatorLabel } from "@/types/habits";
import { Button, Icon, Text, useTheme, type MD3Theme, TouchableRipple, Dialog, Portal } from 'react-native-paper';
import { formatValue } from '@u/helpers';
import { getMeasurementTypeData } from '@t/measurements';
import Points from '@c/Points';
import { Icons } from '@u/constants/Icons';
import { callDeleteHabit, callUpdateHabit, callUpdateHabits } from '@s/dataReducer';
import { router } from 'expo-router';
import Header from '@c/Header';
import DraggableFlatList, { NestableDraggableFlatList, NestableScrollContainer, ScaleDecorator } from 'react-native-draggable-flatlist';

const Habits = () => {
  const dispatch = useDispatch();
  const habits = useComputedHabits();

  const theme = useTheme();
  
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [deletionTarget, setDeletionTarget] = useState<ComputedHabit | null>(null);

  const [isReordering, setIsReordering] = useState(false);
  const [priorityOverrides, setPriorityOverrides] = useState<string[] | null>(null);
  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set());

  const handleDeleteHabit = (habit: ComputedHabit) => {
    setDeletionTarget(habit);
    setIsDialogVisible(true);
  };

  const handleConfirmDeleteHabit = (habit: ComputedHabit | null) => {
    if (habit) dispatch(callDeleteHabit(habit))
    
    setDeletionTarget(null);
    setIsDialogVisible(false);
  };
  const handleArchiveHabit = (habit: ComputedHabit, archived: boolean) => {
    dispatch(callUpdateHabit({ ...habit, archived }));
  };

  const handleAddHabitPress = () => {
    router.push(`/habit/create`);
  }
  const handleEditHabit = (habit: ComputedHabit) => {
    router.push(`/habit/${habit.id}`);
  }

  const handleSubmitReorderedHabits = (nextPriorities: string[] | null) => {
    if (!nextPriorities || !nextPriorities.length) return;

    const updatedHabits: ComputedHabit[] = [];
    habits.forEach((habit) => {
      const nextPriority = nextPriorities.findIndex((id) => id === habit.id);
      if (habit.priority === nextPriority) return;

      updatedHabits.push({ ...habit, priority: nextPriority });
    });

    if (!updatedHabits.length) return;
    dispatch(callUpdateHabits(updatedHabits));
  }

  const orderedHabits = priorityOverrides?.length
    ? priorityOverrides
      .map((overrideId) => habits.find(({ id }) => id === overrideId))
      .filter((m) => !!m)
    : habits;
  const activeHabits = orderedHabits.filter(({ archived }) => !archived);
  const archivedHabits = orderedHabits.filter(({ archived }) => archived);

  const targetPoints = activeHabits.reduce((current, { isWeekly, daysPerWeek, points }) => {
    return current + (isWeekly ? 1 : daysPerWeek) * points;
  }, 0);

  const styles = createListStyles(theme);

  return (
    <>
      <Header title='Habits' actionButton={
        (
          <Button
            mode='text'
            textColor={theme.colors.onSurface}
            buttonColor={isReordering ? theme.colors.surfaceDisabled : 'transparent'}
            onPress={() => {
              setIsReordering(!isReordering);

              if (isReordering) {
                handleSubmitReorderedHabits(priorityOverrides);
              } else {
                setPriorityOverrides(habits.map(({ id }) => id));
              }
            }}
          >
            {isReordering ? 'SAVE ORDER' : 'SET ORDER'}
          </Button>
        )
      }/>
      <View style={styles.container}>
        <NestableScrollContainer style={styles.scrollContainer}>
          <View style={styles.habitsContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitle}>
                <Text style={styles.sectionHeaderText} variant='labelMedium'>{`${isReordering ? 'ALL' : 'ACTIVE'} HABITS (${activeHabits.length})`}</Text>
                {isReordering ? null : (
                  <View style={styles.targetPoints}>
                    <Text variant='bodySmall'>Target: </Text>
                    <Points size='small' points={targetPoints} color={theme.colors.onSurface} />
                    <Text variant='bodySmall'>/WEEK</Text>
                  </View>
                )}
              </View>
            </View>
            {activeHabits.length ? (
              <>
                {isReordering ? (
                  <NestableDraggableFlatList
                    data={priorityOverrides || []}
                    onDragEnd={({ data }) => {
                      setPriorityOverrides(data);
                    }}
                    keyExtractor={(id) => id}
                    activationDistance={1}
                    renderItem={({ item: habitId, drag, isActive }) => {
                      const habit = habits.find(({ id }) => id === habitId);
                      if (!habit) return;

                      return (
                        <TouchableRipple
                          onPressIn={() => isReordering && drag()}
                          disabled={isActive}
                        >
                          <HabitItem
                            habit={habit}
                            onEdit={handleEditHabit}
                            onArchive={handleArchiveHabit}
                            onDelete={handleDeleteHabit}
                          />
                        </TouchableRipple>
                      );
                    }}
                  />
                ) : (
                  <>
                    {activeHabits.map((habit, index) => (
                      <TouchableRipple
                        key={habit.id}
                        onPress={() => {
                          const nextExpandedHabits = new Set([...expandedHabits]);
                          nextExpandedHabits.has(habit.id)
                            ? nextExpandedHabits.delete(habit.id)
                            : nextExpandedHabits.add(habit.id);
                          setExpandedHabits(nextExpandedHabits);
                        }}
                      >
                        <HabitItem
                          habit={habit}
                          onEdit={handleEditHabit}
                          onArchive={handleArchiveHabit}
                          onDelete={handleDeleteHabit}
                          expanded={expandedHabits.has(habit.id)}
                        />
                      </TouchableRipple>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={styles.noData}>
                <View style={styles.noDataIcon}>
                  <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                </View>
                <Text style={styles.noDataText} variant='bodyLarge'>No active habits</Text>
              </View>
            )}
            {archivedHabits.length ? (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderTitle}>
                    <View style={styles.sectionHeaderTitleIcon}>
                      <Icon source={Icons.hide} size={14} color={theme.colors.onSurface} />
                    </View>
                    <Text style={styles.sectionHeaderText} variant='labelMedium'>{`HIDDEN HABITS (${archivedHabits.length})`}</Text>
                  </View>
                </View>
                {archivedHabits.map((habit) => (
                  <TouchableRipple
                    key={habit.id}
                    onPress={() => {
                      const nextExpandedHabits = new Set([...expandedHabits]);
                      nextExpandedHabits.has(habit.id)
                        ? nextExpandedHabits.delete(habit.id)
                        : nextExpandedHabits.add(habit.id);
                      setExpandedHabits(nextExpandedHabits);
                    }}
                  >
                    <HabitItem
                      habit={habit}
                      onEdit={handleEditHabit}
                      onArchive={handleArchiveHabit}
                      onDelete={handleDeleteHabit}
                      expanded={expandedHabits.has(habit.id)}
                    />
                  </TouchableRipple>
                ))}
              </>
            ) : null}
          </View>
        </NestableScrollContainer>
        <View style={styles.createButtonContainer}>
          <TouchableRipple
            style={styles.createButton}
            onPress={() => handleAddHabitPress()}
          >
            <View style={styles.createButtonContent}>
              <Icon source={Icons.add} size={16} color={theme.colors.inverseOnSurface} />  
              <Text variant='titleSmall' style={styles.createButtonText}>CREATE HABIT</Text>
            </View>
          </TouchableRipple>
        </View>
        <Portal>
          <Dialog
            visible={isDialogVisible}
            onDismiss={() => setIsDialogVisible(false) }
            dismissable
          >
            <Dialog.Title>Delete Habit</Dialog.Title>
            <Dialog.Content>
              <Text variant='bodyMedium'>
                Are you sure you want to delete this habit? This action cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                contentStyle={styles.dialogButton}
                onPress={() => setIsDialogVisible(false)}
                mode='text'
                textColor={theme.colors.onSurface}
              >
                CANCEL
              </Button>
              <Button
                contentStyle={styles.dialogButton}  
                onPress={() => handleConfirmDeleteHabit(deletionTarget)}
                mode='text'
                textColor={theme.colors.error}
              >
                DELETE
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </>
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
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: theme.colors.elevation.level3,
    minHeight: 48,
    flexDirection: 'row',
  },
  sectionHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: 8
  },
  sectionHeaderTitleIcon: {
    
  },
  sectionHeaderText: {
    color: theme.colors.onSurface,
    flexGrow: 1,
  },
  sectionHeaderIcon: {
    marginRight: 8,
  },
  targetPoints: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexGrow: 1,
    gap: 2,
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  createButton: {
    borderRadius: 100,
    backgroundColor: theme.colors.inverseSurface,
    shadowRadius: 5,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
  },
  createButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  createButtonText: {
    color: theme.colors.inverseOnSurface,
  },
  reorderButton: {

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
  dialogButton: {
    paddingHorizontal: 8,
  }
});

type HabitItemProps = {
  habit: ComputedHabit;
  onEdit: (habit: ComputedHabit) => void;
  onArchive: (habit: ComputedHabit, archived: boolean) => void;
  onDelete: (habit: ComputedHabit) => void;
  expanded?: boolean
};

const HabitItem = (props: HabitItemProps): JSX.Element | null => {
  const {
    habit,
    onEdit,
    onArchive,
    onDelete,
    expanded,
  } = props;

  const measurements = useMeasurementsByIds(habit.conditions.map(({ measurementId }) => measurementId ));
  
  const theme = useTheme();
  const styles = createItemStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.labelContainer}>
          <Text variant='titleMedium' ellipsizeMode='tail' numberOfLines={1} style={styles.name}>
            {habit.name}
          </Text>
        </View>
        <View style={styles.pointsContainer}>
          <View style={styles.scopeTag}>
            <Text variant='bodySmall' style={styles.scopeTagText}>
              {habit.isWeekly ? 'WEEKLY' : `DAILY x${habit.daysPerWeek}`}
            </Text>
          </View>
          <Points points={habit.points} />
        </View>
      </View>
      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.conditionsContainer}>
            {habit.conditions.length > 1 ? (
              <View style={styles.predicate}>
                <Icon source={getHabitPredicateIcon(habit.predicate)} size={14} color={theme.colors.onSurface} />
                <Text variant='bodyMedium' ellipsizeMode='tail' numberOfLines={1} style={styles.predicateLabel}>{getHabitPredicateLabel(habit.predicate)}</Text>
              </View>
            ) : null}
            {habit.conditions.map((condition, index) => {
              const measurement = measurements[index];
              if (!measurement) return null;

              const isDuration = measurement.type === 'duration';
              const isBool = measurement.type === 'bool';
              const isTime = measurement.type === 'time';
              const isCountable = !isBool && !isTime;

              const valueString = formatValue(condition.target, measurement.type);
              const operatorLabel = getHabitOperatorLabel(condition.operator, measurement.type).toLowerCase();
              const typeData = getMeasurementTypeData(measurement.type);


              let conditionLabel = null;
              if (!isCountable) {
                conditionLabel = (
                  <>
                    <Text variant='bodyMedium' numberOfLines={1} style={styles.conditionOperator}>{operatorLabel}</Text>
                    <Text variant='labelLarge' numberOfLines={1} style={styles.conditionValue}>{valueString}</Text>
                  </>
                )
              } else if (isCountable) {
                conditionLabel = (
                  <>
                    <Text variant='bodyMedium' numberOfLines={1} style={styles.conditionOperator}>{operatorLabel}</Text>
                    <Text variant='labelLarge' numberOfLines={1} style={styles.conditionValue}>{valueString}</Text>
                    {isDuration || !measurement.unit ? null : <Text variant='labelLarge' numberOfLines={1} style={styles.measurementUnit}>{measurement.unit}</Text>}
                  </>
                )
              }
              return (
                <View key={index} style={styles.condition}>
                  <View style={styles.conditionMeasurement}>
                    <Icon source={typeData.icon} size={14} />
                    <Text numberOfLines={1} ellipsizeMode='tail' variant='titleSmall'>
                      {measurement.name}
                    </Text>
                    {measurement.variant ? (
                      <>
                        <Text numberOfLines={1} ellipsizeMode='tail' variant='bodyMedium'>:</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' variant='bodyMedium'>{measurement.variant}</Text>
                      </>
                    ) : null}
                  </View>
                  {conditionLabel}
                </View>
              )
            })}
          </View>
          <View style={styles.controlContainer}>
            <Button
              contentStyle={styles.controlButton}
              mode='text'
              textColor={theme.colors.onSurface}
              onPress={() => onEdit(habit)}
            >
              EDIT
            </Button>
            <Button
              contentStyle={styles.controlButton}
              mode='text'
              textColor={theme.colors.onSurface}
              onPress={() => onArchive(habit, !habit.archived)}
            >
              {habit.archived ? 'SHOW' : 'HIDE'}
            </Button>
            <Button
              contentStyle={styles.controlButton}
              mode='text'
              textColor={theme.colors.error}
              onPress={() => onDelete(habit)}
            >
              DELETE
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const createItemStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    marginTop: -1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: theme.colors.surfaceVariant,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
  },
  pointsContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',  
    justifyContent: 'flex-end',
    gap: 8,
  },
  scopeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceDisabled,
    borderRadius: 10,
  },
  scopeTagText: {
    color: theme.colors.outline,
  },
  expandedContent: {
    gap: 8,
  },
  conditionsContainer: {
    gap: 8,
  },
  predicate: {
    flexDirection: 'row',
    alignItems: 'center',  
    gap: 4,
  },
  predicateLabel: {
    textTransform: 'uppercase',
  },
  condition: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  conditionMeasurement: {
    flexShrink: 1,
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 4,
  },
  measurementActivity: {
  },
  measurementVariant: {
  },
  conditionOperator: {
    flexShrink: 0,
    marginLeft: 2,
  },
  conditionValue: {
    flexShrink: 0,
  },
  measurementUnit: {
    flexShrink: 0,
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  controlButton: {
    paddingHorizontal: 8,
  },
});

export default Habits;