import { Fragment, useRef, useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent, Dimensions } from "react-native";

import { useMeasurements, useUser, useMeasurementUnits, useAllMeasurementUnitsByMeasurementType, useMeasurementUnitsByMeasurementType, useHabitsByMeasurement, useHabitsByMeasurements } from "@/store/selectors";
import { addMeasurement, removeMeasurement, editMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { type Measurement, createMeasurement, createMeasurementUnit, measurementTypeData, type MeasurementType, generateDefaultEmptyUnit, defaultMeasurementUnits } from "@/types/measurements";
import { Button, Icon, IconButton, Menu, SegmentedButtons, Surface, Text, TextInput, AnimatedFAB, FAB, HelperText, Chip, useTheme, Modal, type MD3Theme, Divider, List, TouchableRipple } from 'react-native-paper';
import { forWeb } from '@u/helpers';
import { EmptyError, Error, NoError } from '@u/constants/Errors';

type EditedMeasurement = {
  step: string;
  id: string;
  userId: string;
  type: MeasurementType;
  activity: string;
  variant: string;
  unit: string;
  archived: boolean;
  recordings: string[];
};

const Measurements = () => {
  const dispatch = useDispatch();
  const measurements = useMeasurements();
  const user = useUser();

  const theme = useTheme();
  const formStyles = createFormStyles(theme);

  const [showForm, setShowForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState<EditedMeasurement | null>(null);
  const [editedMeasurement, setEditedMeasurement] = useState<EditedMeasurement | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleEditMeasurement = (editedMeasurement: Measurement) => dispatch(editMeasurement({
    id: editedMeasurement.id,
    updates: editedMeasurement,
  }));
  
  const handleDeleteMeasurement = (measurement: Measurement) => dispatch(removeMeasurement(measurement.id));
  const handleArchiveMeasurement = (measurement: Measurement, archived: boolean) => {
    dispatch(editMeasurement({
      id: measurement.id,
      updates: { ...measurement, archived },
    }));
  };

  const handleAddMeasurement = (newMeasurement: Measurement) => {
    dispatch(addMeasurement(newMeasurement));
    setTimeout(() => {
      scrollToEnd();
    }, 0);
  }
  
  const getInitialEditedMeasurement = (measurement: Measurement) => ({
    ...measurement,
    step: measurement.step.toString(),
  });
  
  const handleAddMeasurementPress = () => {
    setShowForm(true);
    setNewMeasurement(getInitialEditedMeasurement(createMeasurement(user.id, 'New activity', 'New variant', 'duration', 'min', 15)));
  }
  const handleMeasurementPress = (measurement: Measurement) => {
    setShowForm(true);
    setEditedMeasurement(getInitialEditedMeasurement(measurement));
  }

  const hideForm = () => {
    setShowForm(false);
    setTimeout(() => {
      setNewMeasurement(null);
      setEditedMeasurement(null);
    }, 250);
  }

  const renderForm = () => {
    const isNew = !!newMeasurement;
    const formMeasurement = newMeasurement || editedMeasurement || null;
    if (formMeasurement === null) return;

    const handleFormEdit = (nextMeasurement: EditedMeasurement) => {
      if (isNew) setNewMeasurement(nextMeasurement);
      else setEditedMeasurement(nextMeasurement);
    }
  
    const handleSave = () => {
      if (hasErrors()) return;
  
      const step = isBool ? 1 : parseFloat(formMeasurement.step);
      const unit = isBool ? '' : formMeasurement.unit;
      const nextMeasurement = {
        ...formMeasurement,
        activity: formMeasurement.activity.trim(),
        variant: formMeasurement.variant.trim(),
        unit,
        step,
      };
  
      if (isNew) handleAddMeasurement(nextMeasurement);
      else handleEditMeasurement(nextMeasurement);

      hideForm();
    };
  
    const handleCancel = () => {
      hideForm();
    }

    const hasErrors = () => {
      if (getActivityErrors().hasError) return true;
      if (getVariantErrors().hasError) return true;
      if (getStepErrors().hasError) return true;
      return false
    }
  
    const getActivityErrors = () => {
      return formMeasurement.activity ? NoError : EmptyError;
    }
  
    const getVariantErrors = () => {
      return NoError;
    }
  
    const getStepErrors = () => {
      if (isBool) return NoError;
      if (!formMeasurement.step) return EmptyError;
      const step = parseFloat(formMeasurement.step);
      if (isNaN(step) || !isFinite(step) || step < 0) return Error('Invalid step');
      return NoError;
    }
  
    const typeData = measurementTypeData.find((data) => data.type === formMeasurement.type) || measurementTypeData[0];
    const isBool = formMeasurement.type === 'bool';
  
    return (
      <>
        <View style={formStyles.header}>
          <Text variant='titleLarge' style={formStyles.title} >{`${isNew ? 'Create' : 'Edit'} measurement`}</Text>
          <IconButton style={formStyles.closeButton} icon={'window-close'} onPress={() => hideForm() } />
        </View>
        <TextInput
          label="Activity"
          style={formStyles.input}
          mode='outlined'
          error={getActivityErrors().hasError}
          value={formMeasurement.activity || ' '}
          onChangeText={(text) => {
            const nextMeasurement = { ...formMeasurement, activity: text };
            handleFormEdit(nextMeasurement);
          }}
          />
        <TextInput
          label="Variant"
          style={formStyles.input}
          mode='outlined'
          error={getVariantErrors().hasError}
          value={formMeasurement.variant || ''}
          onChangeText={(text) => {
            const nextMeasurement = { ...formMeasurement, variant: text };
            handleFormEdit(nextMeasurement);
          }}
        />
        <View style={formStyles.typeSelection}>
          <View style={formStyles.typeIcon}>
            <Icon source={typeData.icon} size={28} color={theme.colors.primary} />
          </View>
          {measurementTypeData.map((data) => {
              const selected = data.type === formMeasurement.type;
              const disabled = !isNew && !selected;
              return (
                <Button
                  key={data.type}
                  style={formStyles.typeButton}
                  mode={selected ? 'contained-tonal' : 'text'}
                  onPress={() => {
                    const nextMeasurement = { ...formMeasurement, type: data.type };
                    handleFormEdit(nextMeasurement);
                  }}
                  compact
                  disabled={disabled}
                  labelStyle={disabled ? formStyles.typeLabelDisabled : formStyles.typeLabel}
                >
                  {data.label}
                </Button>
              );
            }
          )}
        </View>
            <TextInput
              style={formStyles.input}
              mode='outlined'
              label="Step"
              error={!!getStepErrors().hasError}
              value={isBool ? '--' : formMeasurement.step.toString() || ''}
              onChangeText={(text) => {
                const nextMeasurement = { ...formMeasurement, step: text };
                handleFormEdit(nextMeasurement);
              }}
              keyboardType="numeric"
              disabled={isBool}
            />
            <TextInput
              style={formStyles.input}
              mode='outlined'
              label='Unit'
              value={isBool ? '--' : formMeasurement.unit}
              onChangeText={(text) => {
                const nextMeasurement = { ...formMeasurement, unit: text };
                handleFormEdit(nextMeasurement);
              }}
              disabled={isBool}
            />
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

  const habitsByMeasurement = useHabitsByMeasurements();
  const activeMeasurements = measurements.filter(({id, archived }) => !archived && habitsByMeasurement.get(id));
  const inactiveMeasurements = measurements.filter(({ id, archived }) => !archived && !habitsByMeasurement.get(id));
  const archivedMeasurements = measurements.filter(({ archived }) => archived);

  const [showActiveOverride, setShowActiveOverride] = useState(0);
  const showActiveMeasurements = showActiveOverride !== -1;
  const [showInactiveOverride, setShowInactiveOverride] = useState(0);
  const showInactiveMeasurements = showInactiveOverride === 1 || !!(showInactiveOverride === 0 && inactiveMeasurements.length);
  const [showArchivedOverride, setShowArchivedOverride] = useState(0);
  const showArchivedMeasurements = showArchivedOverride === 1;

  const listStyles = createListStyles(theme);
  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer} scrollEventThrottle={64}>
        <View style={listStyles.measurementsContainer}>
          <List.Accordion
            title={
              <View style={listStyles.sectionHeaderTitle}>
                <View style={listStyles.sectionHeaderTitleIcon}>
                  <Icon source='pencil-outline' size={18} color={theme.colors.primary} />
                </View>
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Active${showActiveMeasurements ? '' : ` (${activeMeasurements.length})`}`}</Text>
              </View>
            }
            expanded={showActiveMeasurements}
            onPress={() => setShowActiveOverride(showActiveMeasurements ? -1 : 1)}
            style={listStyles.sectionHeader}
            right={() => (
              <View style={listStyles.sectionHeaderIcon}>
                <Icon source={showActiveMeasurements ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.primary} />
              </View>
            )}
          >
            {showActiveMeasurements ? (
              <>
                {activeMeasurements.length ? (
                  activeMeasurements.map((measurement) => (
                    <Fragment key={measurement.id}>
                      <Divider style={listStyles.divider} />
                      <MeasurementItem
                        measurement={measurement}
                        onPress={handleMeasurementPress}
                        onArchive={handleArchiveMeasurement}
                        onDelete={handleDeleteMeasurement}
                      />
                    </Fragment>
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source='alert-circle-outline' size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No active measurements</Text>
                  </View>
                )}
              </>
            ) : null}
          </List.Accordion>
          <List.Accordion
            title={
              <View style={listStyles.sectionHeaderTitle}>
                <View style={listStyles.sectionHeaderTitleIcon}>
                  <Icon source='pencil-off-outline' size={18} color={theme.colors.primary} />
                </View>
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Inactive${showInactiveMeasurements ? '' : ` (${inactiveMeasurements.length})`}`}</Text>
              </View>
            }
            expanded={showInactiveMeasurements}
            onPress={() => setShowInactiveOverride(showInactiveMeasurements ? -1 : 1)}
            style={listStyles.sectionHeader}
            right={() => (
              <View style={listStyles.sectionHeaderIcon}>
                <Icon source={showInactiveMeasurements ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.primary} />
              </View>
            )}
            >
            {showInactiveMeasurements ? (
              <>
                {inactiveMeasurements.length ? (
                  inactiveMeasurements.map((measurement) => (
                    <Fragment key={measurement.id}>
                      <Divider style={listStyles.divider} />
                      <MeasurementItem
                        measurement={measurement}
                        onPress={handleMeasurementPress}
                        onArchive={handleArchiveMeasurement}
                        onDelete={handleDeleteMeasurement}
                      />
                    </Fragment>
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source='alert-circle-outline' size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No inactive measurements</Text>
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
                <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Archived${showArchivedMeasurements ? '' : ` (${archivedMeasurements.length})`}`}</Text>
              </View>
            }
            expanded={showArchivedMeasurements}
            onPress={() => setShowArchivedOverride(showArchivedMeasurements ? -1 : 1)}
            style={listStyles.sectionHeader}
            right={() => (
              <View style={listStyles.sectionHeaderIcon}>
                <Icon source={showArchivedMeasurements ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.primary} />
              </View>
            )}
          >
            {showArchivedMeasurements ? (
              <>
                {archivedMeasurements.length ? (
                  archivedMeasurements.map((measurement) => (
                    <Fragment key={measurement.id}>
                      <Divider style={listStyles.divider} />
                      <MeasurementItem
                        measurement={measurement}
                        onPress={handleMeasurementPress}
                        onArchive={handleArchiveMeasurement}
                        onDelete={handleDeleteMeasurement}
                      />
                    </Fragment>
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source='alert-circle-outline' size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No archived measurements</Text>
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
          onPress={() => handleAddMeasurementPress()}
          icon='clipboard-edit-outline'
          mode='elevated'
          buttonColor={theme.colors.secondaryContainer}
          contentStyle={{ height: 56}}
        >
          <Text variant='labelLarge' style={listStyles.createButtonText}>Create measurement</Text>  
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
  measurementsContainer: {
    paddingBottom: 88
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
  divider: {
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: 16,
    display: 'none',
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
  },
  input: {
    marginBottom: 16,
    // backgroundColor: theme.colors.elevation.level3,
  },
  typeSelection: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // height: 44,

    marginBottom: 20,
    marginTop: 32,
  },
  typeIcon: {
    marginLeft: 8,
    marginRight: 4,

  },
  typeButton: {
    // marginRight: 4,
    // borderRadius: 200,
    // paddingHorizontal: forWeb(0, 6),
    // marginVertical: 10,
  },
  typeLabel: {
    paddingHorizontal: 6,
    color: theme.colors.primary,
    // marginVertical: 10,
  },
  typeLabelDisabled: {
    paddingHorizontal: 6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
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
});

const MeasurementItem = ({ measurement, onPress, onArchive, onDelete }: {
  measurement: Measurement;
  onPress: (measurement: Measurement) => void;
  onArchive: (measurement: Measurement, archived: boolean) => void;
  onDelete: (measurement: Measurement) => void;
}): JSX.Element => {

  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const habits = useHabitsByMeasurement(measurement);
  const habitCount = habits.length;

  const theme = useTheme();
  const itemStyles = createItemStyles(theme);

  const typeData = measurementTypeData.find((data) => data.type === measurement.type) || measurementTypeData[0];
  const hasHabits = habitCount !== 0;
  return (
    <TouchableRipple style={itemStyles.container} onPress={() => { onPress(measurement); }}>
      <>
        <View style={itemStyles.typeIcon}>
          <Icon source={typeData.icon} size={28} color={theme.colors.primary} />
        </View>
        <View style={itemStyles.content}>
          <View style={itemStyles.labelContainer}>
            <Text style={itemStyles.labelActivity} variant='titleMedium'>{measurement.activity}</Text>
            {measurement.variant ? <Text style={itemStyles.labelDivider} variant='bodyMedium'> : </Text> : null}
            <Text style={itemStyles.labelVariant} variant='bodyMedium'>{measurement.variant}</Text>
          </View>
          <View style={itemStyles.habitCountContainer}>
            <View style={itemStyles.habitCountIcon}>
              <Icon source='checkbox-multiple-marked-outline' size={18} color={hasHabits ? theme.colors.primary : theme.colors.outline} />
            </View>
            <Text variant='titleSmall' style={{ ...itemStyles.habitCountText, ...(hasHabits ? {} : itemStyles.habitCountTextInactive)}}>
              {habitCount} Habit{habitCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        <Menu
          visible={isMenuVisible}
          onDismiss={() => setIsMenuVisible(false)}
          anchor={
            <IconButton
            style={itemStyles.menuButton} icon='dots-vertical' size={24}
            onPress={() => { setIsMenuVisible(true); }}
            onResponderRelease={(e) => { e.preventDefault(); }}
            />
          }
          anchorPosition='bottom'
          >
          <Menu.Item
            leadingIcon='archive-outline'
            onPress={() => { onArchive(measurement, !measurement.archived); }}
            title={measurement.archived ? 'Unarchive' : 'Archive'}
            />
          <Menu.Item
            leadingIcon='delete-outline'
            onPress={() => { onDelete(measurement); }}
            title="Delete"
            />
        </Menu>
      </>
    </TouchableRipple>
  );
};

const createItemStyles = (theme: MD3Theme) => StyleSheet.create({
  item: {
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    marginRight: 8,
    marginLeft: -6,
  },
  content: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelActivity: {
  },
  labelDivider: {
    marginHorizontal: 2,
  },
  labelVariant: {
  },
  habitCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 16,
    borderRadius: 8,
    // height: 40,
    // minWidth: 112,
    // backgroundColor: theme.colors.secondaryContainer,
  },
  habitCountIcon: {
    // marginTop: 11,
    marginRight: 6,
  },
  habitCountText: {
    flexGrow: 1,
    color: theme.colors.primary,
    lineHeight: 24,
    // marginTop: 8,
    // textAlign: 'center',
  },
  habitCountTextInactive: {
    color: theme.colors.outline,
  },
  menuButton: {
    marginLeft: 8,
    marginRight: 0,
  },
});

export default Measurements;