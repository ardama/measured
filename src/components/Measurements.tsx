import React, { useState } from "react";
import { View, StyleSheet } from "react-native";

import { useMeasurements, useMeasurementUsage } from "@/store/selectors";
import { useDispatch } from "react-redux";
import { type Measurement, getMeasurementTypeData } from "@/types/measurements";
import { Button, Icon, Text, useTheme, type MD3Theme, TouchableRipple, Dialog, Portal } from 'react-native-paper';
import { Icons } from '@u/constants/Icons';
import { callDeleteMeasurement, callUpdateMeasurement, callUpdateMeasurements } from '@s/dataReducer';
import { router } from 'expo-router';
import Header from '@c/Header';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";

const Measurements = () => {
  const dispatch = useDispatch();
  const measurements = useMeasurements();
  const measurementUsage = useMeasurementUsage();

  const theme = useTheme();

  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [deletionTarget, setDeletionTarget] = useState<Measurement | null>(null);
  const deletionTargetUsage = deletionTarget && measurementUsage.get(deletionTarget.id);
  const canDelete = (
    !deletionTargetUsage?.habits.length
    && !deletionTargetUsage?.pastHabits.length
    && !deletionTargetUsage?.measurements.length
  );

  const [isReordering, setIsReordering] = useState(false);
  const [priorityOverrides, setPriorityOverrides] = useState<string[] | null>(null);
  const [expandedMeasurements, setExpandedMeasurements] = useState<Set<string>>(new Set());

  const handleDeleteMeasurement = (measurement: Measurement) => {
    setDeletionTarget(measurement);
    setIsDialogVisible(true);
  };
  const handleConfirmDeleteMeasurement = (measurement: Measurement | null) => {
    if (measurement) dispatch(callDeleteMeasurement(measurement))
    
    setDeletionTarget(null);
    setIsDialogVisible(false);
  };
  const handleArchiveMeasurement = (measurement: Measurement, archived: boolean) => {
    dispatch(callUpdateMeasurement({ ...measurement, archived }));
  };

  const handleAddMeasurementPress = () => {
    router.push(`/measurement/create`);
  }

  const handleEditMeasurement = (measurement: Measurement) => {
    router.push(`/measurement/${measurement.id}`);
  }

  const handleSubmitReorderedMeasurements = (nextPriorities: string[] | null) => {
    if (!nextPriorities || !nextPriorities.length) return;

    const updatedMeasurements: Measurement[] = [];
    measurements.forEach((measurement) => {
      const nextPriority = nextPriorities.findIndex((id) => id === measurement.id);
      if (measurement.priority === nextPriority) return;

      updatedMeasurements.push({ ...measurement, priority: nextPriority });
    });

    if (!updatedMeasurements.length) return;
    dispatch(callUpdateMeasurements(updatedMeasurements));
  }

  const orderedMeasurements = priorityOverrides?.length
    ? priorityOverrides
      .map((overrideId) => measurements.find(({ id }) => id === overrideId))
      .filter((m) => !!m)
    : measurements;
  const activeMeasurements = orderedMeasurements.filter(({ archived }) => !archived || isReordering);
  const archivedMeasurements = orderedMeasurements.filter(({ archived }) => archived && !isReordering);

  const styles = createListStyles(theme);

  return (
    <>
      <Header
        title='Measurements'
        bordered
        actionButton={(
          <Button
            mode='text'
            textColor={theme.colors.onSurface}
            buttonColor={isReordering ? theme.colors.surfaceDisabled : 'transparent'}
            onPress={() => {
              setIsReordering(!isReordering);

              if (isReordering) {
                handleSubmitReorderedMeasurements(priorityOverrides);
              } else {
                setPriorityOverrides(measurements.map(({ id }) => id));
              }
            }}
          >
            {isReordering ? 'SAVE ORDER' : 'SET ORDER'}
          </Button>
        )}
      />
      <View style={styles.container}>
        <NestableScrollContainer style={styles.scrollContainer}>
          <View style={styles.measurementsContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitle}>
                <Text style={styles.sectionHeaderText} variant='labelMedium'>{`${isReordering ? 'ALL' : 'ACTIVE'} MEASUREMENTS (${activeMeasurements.length})`}</Text>
              </View>
            </View>
            {activeMeasurements.length ? (
              <>
                {isReordering ? (
                  <NestableDraggableFlatList
                    data={priorityOverrides || []}
                    onDragEnd={({ data }) => {
                      setPriorityOverrides(data);
                    }}
                    keyExtractor={(id) => id}
                    activationDistance={1}
                    renderItem={({ item: measurementId, drag, isActive }) => {
                      const measurement = measurements.find(({ id }) => id === measurementId);
                      if (!measurement) return;

                      return (
                        <TouchableRipple
                          onPressIn={() => isReordering && drag()}
                          disabled={isActive}
                        >
                          <MeasurementItem
                            measurement={measurement}
                            onEdit={handleEditMeasurement}
                            onArchive={handleArchiveMeasurement}
                            onDelete={handleDeleteMeasurement}
                            usage={measurementUsage.get(measurement.id)}
                          />
                        </TouchableRipple>
                      );
                    }}
                  />
                ) : (
                  <>
                    {activeMeasurements.map((measurement) => (
                      <TouchableRipple
                        key={measurement.id}
                        onPress={() => {
                          const nextExpandedMeasurements = new Set([...expandedMeasurements]);
                          nextExpandedMeasurements.has(measurement.id)
                            ? nextExpandedMeasurements.delete(measurement.id)
                            : nextExpandedMeasurements.add(measurement.id);
                          setExpandedMeasurements(nextExpandedMeasurements);
                        }}
                      >
                        <MeasurementItem
                          measurement={measurement}
                          onEdit={handleEditMeasurement}
                          onArchive={handleArchiveMeasurement}
                          onDelete={handleDeleteMeasurement}
                          usage={measurementUsage.get(measurement.id)}
                          expanded={expandedMeasurements.has(measurement.id)}
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
                <Text style={styles.noDataText} variant='bodyLarge'>No active measurements</Text>
              </View>
            )}
            {archivedMeasurements.length ? (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderTitle}>
                    <View style={styles.sectionHeaderTitleIcon}>
                      <Icon source={Icons.hide} size={14} color={theme.colors.onSurface} />
                    </View>
                    <Text style={styles.sectionHeaderText} variant='labelMedium'>{`HIDDEN MEASUREMENTS (${archivedMeasurements.length})`}</Text>
                  </View>
                </View>
                {archivedMeasurements.map((measurement) => (
                  <TouchableRipple
                    key={measurement.id}
                    onPress={() => {
                      const nextExpandedMeasurements = new Set([...expandedMeasurements]);
                      nextExpandedMeasurements.has(measurement.id)
                        ? nextExpandedMeasurements.delete(measurement.id)
                        : nextExpandedMeasurements.add(measurement.id);
                      setExpandedMeasurements(nextExpandedMeasurements);
                    }}
                  >
                    <MeasurementItem
                      measurement={measurement}
                      onEdit={handleEditMeasurement}
                      onArchive={handleArchiveMeasurement}
                      onDelete={handleDeleteMeasurement}
                      usage={measurementUsage.get(measurement.id)}
                      expanded={!isReordering && expandedMeasurements.has(measurement.id)}
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
            onPress={() => handleAddMeasurementPress()}
          >
            <View style={styles.createButtonContent}>
              <Icon source={Icons.add} size={16} color={theme.colors.inverseOnSurface} />  
              <Text variant='titleSmall' style={styles.createButtonText}>CREATE MEASUREMENT</Text>
            </View>
          </TouchableRipple>
        </View>
        <Portal>
          <Dialog
            visible={isDialogVisible}
            onDismiss={() => setIsDialogVisible(false) }
            dismissable
          >
            <Dialog.Title>Delete measurement</Dialog.Title>
            <Dialog.Content>
              <Text variant='bodyMedium'>
                {canDelete
                  ? 'Are you sure you want to delete this measurement, including all of its recordings? This action cannot be undone.'
                  : 'This measurement is currently being referenced and cannot be deleted.'
                }
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                contentStyle={styles.dialogButton}
                onPress={() => setIsDialogVisible(false)}
                mode='text'
                textColor={theme.colors.onSurface}
              >
                {canDelete ? 'CANCEL' : 'CLOSE'}
              </Button>
              {canDelete &&
                <Button
                  contentStyle={styles.dialogButton}  
                  onPress={() => handleConfirmDeleteMeasurement(deletionTarget)}
                  mode='text'
                  textColor={theme.colors.error}
                >
                  DELETE
                </Button>
              }
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
  measurementsContainer: {
    paddingBottom: 88
  },
  sectionHeader: {
    paddingHorizontal: 16,
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

type MeasurementItemProps = {
  measurement: Measurement
  onEdit: (measurement: Measurement) => void
  onArchive: (measurement: Measurement, archived: boolean) => void
  onDelete: (measurement: Measurement) => void
  usage?: { measurements: string[], habits: string[], pastHabits: string[] }
  expanded?: boolean
};

const MeasurementItem = (props: MeasurementItemProps): JSX.Element => {
  const {
    measurement,
    usage,
    onEdit,
    onArchive,
    onDelete,
    expanded,
  } = props;

  
  const typeData = getMeasurementTypeData(measurement.type);
  const hasCombos = !!usage?.measurements.length;
  const hasHabits = !!usage?.habits.length;
  const hasPastHabits = !!usage?.pastHabits.length;
  const isInactive = !hasHabits && !hasCombos;
  
  const theme = useTheme();
  const styles = createItemStyles(theme);
  const color = theme.colors.onSurface;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.typeIcon}>
          <Icon source={typeData.icon} size={18} color={color} />
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.labelName} variant='titleMedium' numberOfLines={1} ellipsizeMode='tail'>
            {measurement.name}
            </Text>
          {measurement.variant ? <Text style={styles.labelDivider} variant='bodyMedium'>:</Text> : null}
          <Text style={styles.labelVariant} variant='bodyLarge' numberOfLines={1} ellipsizeMode='tail'>
            {measurement.variant}
          </Text>
        </View>
        <View style={styles.habitCountContainer}>
          {isInactive ? (
            <View style={styles.usage}>
              <View style={styles.usageIcon}>
                <Icon source={Icons.warning} size={14} color={theme.colors.outline} />
              </View>
              <Text variant='bodySmall' style={styles.usageText}>
                Unused
              </Text>
            </View>
          ) : null}
          {hasHabits ? (
            <View style={styles.usage}>
              <View style={styles.usageIcon}>
                <Icon source={Icons.habit} size={14} color={theme.colors.outline} />
              </View>
              <Text variant='bodySmall' style={styles.usageText}>
                {usage.habits.length} Habit{usage.habits.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
          {hasCombos ? (
            <View style={styles.usage}>
              <View style={styles.usageIcon}>
                <Icon source={Icons.measurement} size={14} color={theme.colors.outline} />
              </View>
              <Text variant='bodySmall' style={styles.usageText}>
                {usage.measurements.length} Combo{usage.measurements.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
          {hasPastHabits ? (
            <View style={styles.usage}>
              <View style={styles.usageIcon}>
                <Icon source={Icons.pastHabit} size={14} color={theme.colors.outline} />
              </View>
              <Text variant='bodySmall' style={styles.usageText}>
                {usage.pastHabits.length} Past habit{usage.pastHabits.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.controlContainer}>
            <Button
              contentStyle={styles.controlButton}
              mode='text'
              textColor={theme.colors.onSurface}
              onPress={() => onEdit(measurement)}
            >
              EDIT
            </Button>
            <Button
              contentStyle={styles.controlButton}
              mode='text'
              textColor={theme.colors.onSurface}
              onPress={() => onArchive(measurement, !measurement.archived)}
            >
              {measurement.archived ? 'SHOW' : 'HIDE'}
            </Button>
            <Button
              contentStyle={styles.controlButton}
              mode='text'
              textColor={theme.colors.error}
              onPress={() => onDelete(measurement)}
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
    paddingHorizontal: 16,
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
  typeIcon: {
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelName: {
  },
  labelDivider: {
    marginHorizontal: 4,
  },
  labelVariant: {
  },
  expandedContent: {
    gap: 8,
  },
  habitCountContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  usage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    backgroundColor: theme.colors.surfaceDisabled,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  usageIcon: {
  },
  usageText: {
    textTransform: 'uppercase',
    color: theme.colors.outline,
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  controlButton: {
    paddingHorizontal: 8,
  },
  placeholder: {
    width: '100%',
    marginTop: -1,
  },
});

export default Measurements;