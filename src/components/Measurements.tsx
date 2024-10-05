import { Fragment, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";

import { useMeasurements, useUser, useHabitsByMeasurement, useHabitsByMeasurements, useMeasurementsByMeasurements } from "@/store/selectors";
import { addMeasurement, removeMeasurement, editMeasurement } from "@/store/userReducer";
import { useDispatch } from "react-redux";
import { type Measurement, createMeasurement, getMeasurementTypeData, type MeasurementType, measurementTypes, type MeasurementOperator, getMeasurementOperatorData, measurementOperators, getMeasurementTypeIcon } from "@/types/measurements";
import { Button, Icon, IconButton, Menu, Text, TextInput, useTheme, Modal, type MD3Theme, Divider, List, TouchableRipple } from 'react-native-paper';
import { formatTime } from '@u/helpers';
import { EmptyError, Error, NoError } from '@u/constants/Errors';
import { Icons } from '@u/constants/Icons';
import useAnimatedSlideIn from '@u/hooks/useAnimatedSlideIn';
import { useDispatchMultiple } from '@u/hooks/useDispatchMultiple';

type EditedMeasurement = {
  step: string;
  id: string;
  userId: string;
  type: MeasurementType;
  activity: string;
  variant: string;
  unit: string;
  archived: boolean;
  defaultValue: string,
  priority: number,
  comboLeftId?: string,
  comboRightId?: string,
  comboOperator?: MeasurementOperator,
};

const Measurements = () => {
  const dispatch = useDispatch();
  const dispatchMultiple = useDispatchMultiple();
  const measurements = useMeasurements();
  const user = useUser();

  const theme = useTheme();
  const formStyles = createFormStyles(theme);

  const [showForm, setShowForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState<EditedMeasurement | null>(null);
  const [editedMeasurement, setEditedMeasurement] = useState<EditedMeasurement | null>(null);

  const [isReordering, setIsReordering] = useState(false);
  const [movingMeasurement, setMovingMeasurement] = useState(-1);

  const [isComboLeftMenuVisible, setIsComboLeftMenuVisible] = useState(false);
  const [isComboRightMenuVisible, setIsComboRightMenuVisible] = useState(false);
  const [isComboOperatorMenuVisible, setIsComboOperatorMenuVisible] = useState(false);

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
    defaultValue: measurement.defaultValue.toString(),
  });
  
  const handleAddMeasurementPress = () => {
    setShowForm(true);
    const lastMeasurement = measurements[measurements.length - 1];
    setNewMeasurement(getInitialEditedMeasurement(createMeasurement(user.id, 'New activity', 'New variant', 'duration', 'min', 15, lastMeasurement.priority + 1)));
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

  const handleReorderMeasurement = (startIndex: number, shift: number): void => {
    const measurement = measurements[startIndex];
    if (!measurement) return;

    const nextPriorities: number[] = [];
    measurements.forEach((m, i) => {
      if (i === 0) nextPriorities[i] = m.priority;
      else nextPriorities[i] = Math.max(m.priority, nextPriorities[i - 1] + 1)
    });

    const index = measurements.findIndex(({ id }) => id === measurement.id);
    if (index < 0) return;

    const nextIndex = index + shift;
    if (nextIndex < 0 || nextIndex >= measurements.length) return;

    const temp = nextPriorities[index];
    nextPriorities[index] = nextPriorities[nextIndex];
    nextPriorities[nextIndex] = temp;

    const actions = measurements.map((m, i) => {
      const priority = nextPriorities[i];
      if (m.priority === priority) return null;
      return editMeasurement({ id: m.id, updates: { priority}})
    }).filter((a) => a !== null);

    setMovingMeasurement(nextIndex);
    dispatchMultiple(actions);
  }

  const renderForm = () => {
    const isNew = !!newMeasurement;
    const formMeasurement = newMeasurement || editedMeasurement || null;
    if (formMeasurement === null) return;

    const typeData = getMeasurementTypeData(formMeasurement.type);
    const isBool = formMeasurement.type === 'bool';
    const isTime = formMeasurement.type === 'time';
    const isCombo = formMeasurement.type === 'combo';

    const comboLeftMeasurement = measurements.find(({ id }) => id === formMeasurement.comboLeftId);
    const comboRightMeasurement = measurements.find(({ id }) => id === formMeasurement.comboRightId);

    const handleFormEdit = (nextMeasurement: EditedMeasurement) => {
      if (isNew) setNewMeasurement(nextMeasurement);
      else setEditedMeasurement(nextMeasurement);
    }
  
    const handleSave = () => {
      if (hasErrors()) return;
  
      const step = isBool ? 1 : isCombo ? 0 : parseFloat(formMeasurement.step);
      const unit = isBool ? '' : isTime ? '' : formMeasurement.unit;
      const defaultValue = isBool ? 0 : parseFloat(formMeasurement.defaultValue);
      const comboLeftId = isCombo ? formMeasurement.comboLeftId : undefined;
      const comboRightId = isCombo ? formMeasurement.comboRightId : undefined;
      const comboOperator = isCombo ? formMeasurement.comboOperator : undefined;
      const nextMeasurement = {
        ...formMeasurement,
        activity: formMeasurement.activity.trim(),
        variant: formMeasurement.variant.trim(),
        unit,
        step,
        defaultValue,
        comboLeftId,
        comboRightId,
        comboOperator,
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
          {measurementTypes.map((type) => {
              const typeData = getMeasurementTypeData(type);
              const selected = type === formMeasurement.type;
              const disabled = !isNew && !selected;
              return (
                <Button
                  key={type}
                  style={formStyles.typeButton}
                  mode={selected ? 'contained-tonal' : 'text'}
                  onPress={() => {
                    const nextMeasurement = { ...formMeasurement, type: type };
                    if (type === 'combo') {
                      nextMeasurement.comboLeftId = nextMeasurement.comboLeftId || measurements[0].id;
                      nextMeasurement.comboRightId = nextMeasurement.comboRightId || measurements[0].id;
                    }
                    handleFormEdit(nextMeasurement);
                  }}
                  compact
                  disabled={disabled}
                  labelStyle={disabled ? formStyles.typeLabelDisabled : formStyles.typeLabel}
                >
                  {typeData.label}
                </Button>
              );
            }
          )}
        </View>
        {isCombo ? (
          <View style={formStyles.comboContainer}>
            <View style={{ flex: 1 }}>
              <Menu
                style={{ maxWidth: 600 }}
                contentStyle={{ maxWidth: 600 }}
                visible={isComboLeftMenuVisible}
                onDismiss={() => {
                  setIsComboLeftMenuVisible(false);
                }}
                anchor={
                  <TouchableRipple
                    style={formStyles.dropdownButton}
                    onPress={() => {
                      setIsComboLeftMenuVisible(true);
                    }}
                  >
                    <>
                      <Icon source={getMeasurementTypeIcon(comboRightMeasurement?.type)} size={16} />
                      <Text ellipsizeMode='tail' variant='titleSmall' numberOfLines={1} style={formStyles.measurementActivity}>
                        {comboLeftMeasurement?.activity}
                      </Text>
                      {comboLeftMeasurement?.variant ? (
                        <Text ellipsizeMode='tail'  numberOfLines={1} variant='bodyMedium' style={formStyles.measurementVariant}> : {comboLeftMeasurement?.variant}</Text>
                      ) : null}
                    </>
                  </TouchableRipple>
                }
                anchorPosition='bottom'
              >
                {measurements
                  .filter(({ id, type }) => id !== formMeasurement.id && type !== 'bool')
                  .map((measurement) => (
                    <Menu.Item
                      style={{ maxWidth: 600 }}
                      contentStyle={{ maxWidth: 600 }}
                      key={measurement.id}
                      title={`${measurement.activity}${measurement.variant ? ` : ${measurement.variant}` : ''}`}
                      leadingIcon={getMeasurementTypeData(measurement.type).icon}
                      onPress={() => {
                        const nextMeasurement = { ...formMeasurement, comboLeftId: measurement.id };
                        handleFormEdit(nextMeasurement);
                        setIsComboLeftMenuVisible(false);
                      }}
                    />
                  ))
                }
              </Menu>
            </View>
            <Menu
              visible={isComboOperatorMenuVisible}
              onDismiss={() => {
                setIsComboOperatorMenuVisible(false);
              }}
              anchor={
                <TouchableRipple
                  style={formStyles.dropdownButton}
                  onPress={() => {
                    setIsComboOperatorMenuVisible(true);
                  }}
                  disabled={isBool}
                >
                  <Text variant='titleSmall'>
                    {getMeasurementOperatorData(formMeasurement.comboOperator).label.toLowerCase()}
                  </Text>
                </TouchableRipple>
              }
              anchorPosition='bottom'
            >
              {
                measurementOperators.map((operator) => {
                  const { icon, label } = getMeasurementOperatorData(operator);
                  return (
                    <Menu.Item
                      key={operator}
                      title={label}
                      leadingIcon={icon}
                      onPress={() => {
                        const nextMeasurement = { ...formMeasurement, comboOperator: operator };
                        handleFormEdit(nextMeasurement);
                        setIsComboOperatorMenuVisible(false);
                      }}
                    />
                  );
                })
              }
            </Menu>
            <View style={{ flex: 1 }}>
              <Menu
                style={{ maxWidth: 600 }}
                contentStyle={{ maxWidth: 600 }}
                visible={isComboRightMenuVisible}
                onDismiss={() => {
                  setIsComboRightMenuVisible(false);
                }}
                anchor={
                  <TouchableRipple
                    style={formStyles.dropdownButton}
                    onPress={() => {
                      setIsComboRightMenuVisible(true);
                    }}
                  >
                    <>
                      <Icon source={getMeasurementTypeIcon(comboRightMeasurement?.type)} size={16} />
                      <Text ellipsizeMode='tail' variant='titleSmall' numberOfLines={1} style={formStyles.measurementActivity}>
                        {comboRightMeasurement?.activity}
                      </Text>
                      {comboRightMeasurement?.variant ? (
                        <Text ellipsizeMode='tail'  numberOfLines={1} variant='bodyMedium' style={formStyles.measurementVariant}> : {comboRightMeasurement?.variant}</Text>
                      ) : null}
                    </>
                  </TouchableRipple>
                }
                anchorPosition='bottom'
              >
                {measurements
                  .filter(({ id, type }) => id !== formMeasurement.id && type !== 'bool')
                  .map((measurement) => (
                    <Menu.Item
                      style={{ maxWidth: 600 }}
                      contentStyle={{ maxWidth: 600 }}
                      key={measurement.id}
                      title={`${measurement.activity}${measurement.variant ? ` : ${measurement.variant}` : ''}`}
                      leadingIcon={getMeasurementTypeData(measurement.type).icon}
                      onPress={() => {
                        const nextMeasurement = { ...formMeasurement, comboRightId: measurement.id };
                        handleFormEdit(nextMeasurement);
                        setIsComboRightMenuVisible(false);
                      }}
                    />
                  ))
                }
              </Menu>
            </View>
          </View>
        ) : null}
        {isCombo ? null : (<TextInput
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
          right={isTime ? <TextInput.Affix text={`(${(parseFloat(formMeasurement.step) * 60).toFixed(0)} minutes)`} /> : null}
        />)}
        <TextInput
          style={formStyles.input}
          mode='outlined'
          label='Unit'
          value={isBool ? '--' : isTime ? 'hours' : formMeasurement.unit}
          onChangeText={(text) => {
            const nextMeasurement = { ...formMeasurement, unit: text };
            handleFormEdit(nextMeasurement);
          }}
          disabled={isBool || isTime}
          />
        {isCombo ? null : (<TextInput
          style={formStyles.input}
          mode='outlined'
          label='Default'
          value={isBool ? 'No' : formMeasurement.defaultValue}
          onChangeText={(text) => {
            const nextMeasurement = { ...formMeasurement, defaultValue: text };
            handleFormEdit(nextMeasurement);
          }}
          disabled={isBool}
          right={isTime ? <TextInput.Affix text={`(${formatTime(parseFloat(formMeasurement.defaultValue))})`} /> : null}
        />)}
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

  const habitsByMeasurements = useHabitsByMeasurements();
  const measurementsByMeasurements = useMeasurementsByMeasurements();
  const activeMeasurements = measurements.filter(({archived }) => !archived);
  // const inactiveMeasurements = measurements.filter(({ id, archived }) => !archived && !(habitsByMeasurements.get(id) || measurementsByMeasurements.get(id)));
  const archivedMeasurements = measurements.filter(({ archived }) => archived);

  const [showActiveOverride, setShowActiveOverride] = useState(0);
  const showActiveMeasurements = showActiveOverride !== -1;
  // const [showInactiveOverride, setShowInactiveOverride] = useState(0);
  // const showInactiveMeasurements = showInactiveOverride === 1 || !!(showInactiveOverride === 0 && inactiveMeasurements.length);
  const [showArchivedOverride, setShowArchivedOverride] = useState(0);
  const showArchivedMeasurements = showArchivedOverride === 1;

  const listStyles = createListStyles(theme);
  const moveUpButtonSlide = useAnimatedSlideIn({ slideDistance: 120 });
  const moveDownButtonSlide = useAnimatedSlideIn({ slideDistance: 64 });

  return (
    <View style={listStyles.container}>
      <ScrollView ref={scrollViewRef} style={listStyles.scrollContainer} scrollEventThrottle={64}>
        <View style={listStyles.measurementsContainer}>
          {isReordering ? (
              <List.Accordion
                title={
                  <View style={listStyles.sectionHeaderTitle}>
                    <View style={listStyles.sectionHeaderTitleIcon}>
                      <Icon source='pencil-outline' size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`All${showActiveMeasurements ? '' : ` (${measurements.length})`}`}</Text>
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
                {measurements.length ? (
                  measurements.map((measurement, index) => (
                    <Fragment key={measurement.id}>
                      <Divider style={listStyles.divider} />
                      <MeasurementItem
                        measurement={measurement}
                        habitCount={(habitsByMeasurements.get(measurement.id) || []).length}
                        comboCount={(measurementsByMeasurements.get(measurement.id) || []).length}
                        onPress={() => setMovingMeasurement(index)}
                        onArchive={handleArchiveMeasurement}
                        onDelete={handleDeleteMeasurement}
                        selected={movingMeasurement === index}
                      />
                    </Fragment>
                  ))
                ) : (
                  <View style={listStyles.noData}>
                    <View style={listStyles.noDataIcon}>
                      <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                    </View>
                    <Text style={listStyles.noDataText} variant='bodyLarge'>No measurements</Text>
                  </View>
                )}
              </List.Accordion>
            ) : (
              <>
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
                              habitCount={(habitsByMeasurements.get(measurement.id) || []).length}
                              comboCount={(measurementsByMeasurements.get(measurement.id) || []).length}
                            />
                          </Fragment>
                        ))
                      ) : (
                        <View style={listStyles.noData}>
                          <View style={listStyles.noDataIcon}>
                            <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                          </View>
                          <Text style={listStyles.noDataText} variant='bodyLarge'>No active measurements</Text>
                        </View>
                      )}
                    </>
                  ) : null}
                </List.Accordion>
                {/* <List.Accordion
                  title={
                    <View style={listStyles.sectionHeaderTitle}>
                      <View style={listStyles.sectionHeaderTitleIcon}>
                        <Icon source='pencil-off-outline' size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={listStyles.sectionHeaderText} variant='titleMedium'>{`Unused${showInactiveMeasurements ? '' : ` (${inactiveMeasurements.length})`}`}</Text>
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
                              habitCount={(habitsByMeasurements.get(measurement.id) || []).length}
                              comboCount={(measurementsByMeasurements.get(measurement.id) || []).length}
                            />
                          </Fragment>
                        ))
                      ) : (
                        <View style={listStyles.noData}>
                          <View style={listStyles.noDataIcon}>
                            <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                          </View>
                          <Text style={listStyles.noDataText} variant='bodyLarge'>No inactive measurements</Text>
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
                              habitCount={(habitsByMeasurements.get(measurement.id) || []).length}
                              comboCount={(measurementsByMeasurements.get(measurement.id) || []).length}
                            />
                          </Fragment>
                        ))
                      ) : (
                        <View style={listStyles.noData}>
                          <View style={listStyles.noDataIcon}>
                            <Icon source={Icons.warning} size={16} color={theme.colors.outline} />
                          </View>
                          <Text style={listStyles.noDataText} variant='bodyLarge'>No archived measurements</Text>
                        </View>
                      )}
                    </>
                  ) : null}
                </List.Accordion>
              </>
            )
          }
        </View>
      </ScrollView>
      <View style={listStyles.createButtonContainer}>
        <Button
          style={listStyles.createButton}
          onPress={() => handleAddMeasurementPress()}
          icon={Icons.measurement}
          mode='elevated'
          buttonColor={theme.colors.secondaryContainer}
          contentStyle={{ height: 56}}
        >
          <Text variant='labelLarge' style={listStyles.createButtonText}>Create measurement</Text>  
        </Button>
        {moveUpButtonSlide.isVisible ? (
          <Animated.View style={[listStyles.reorderIconButtonContainer, listStyles.reorderIconButtonUp, moveUpButtonSlide.slideStyle]}>
            <IconButton
              style={[listStyles.reorderIconButton]}
              icon={Icons.moveUp}
              iconColor={theme.colors.onPrimary}
              onPress={(e) => {
                handleReorderMeasurement(movingMeasurement, -1);
                e.stopPropagation();
              }}
              />
          </Animated.View>
        ) : null}
        {moveDownButtonSlide.isVisible ? (
          <Animated.View style={[listStyles.reorderIconButtonContainer, listStyles.reorderIconButtonDown, moveDownButtonSlide.slideStyle]}>
            <IconButton
              style={[listStyles.reorderIconButton]}
              icon={Icons.moveDown}
              iconColor={theme.colors.onPrimary}
              onPress={(e) => {
                handleReorderMeasurement(movingMeasurement, 1);
                e.stopPropagation();
              }}
            />
          </Animated.View>
        ) : null}
        <Button
          style={listStyles.reorderButton}
          onPress={() => {
            setIsReordering(!isReordering);
            if (isReordering) {
              moveUpButtonSlide.hide();
              moveDownButtonSlide.hide();
            } else {
              moveUpButtonSlide.show();
              moveDownButtonSlide.show();
              setMovingMeasurement(measurements.length ? 0 : -1);
            }
          }}
          mode='elevated'
          buttonColor={isReordering ? theme.colors.primary : theme.colors.secondaryContainer}
          contentStyle={{ height: 56 }}
        >
          <View style={{ marginHorizontal: -4 }}>
            <Icon source={isReordering ? Icons.close : Icons.move} size={24} color={isReordering ? theme.colors.onPrimary : theme.colors.primary} />
          </View>
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
  divider: {
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: 16,
    display: 'none',
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    gap: 16,
  },
  createButton: {
    borderRadius: 12,
    flex: 1,
    maxWidth: 600,
    shadowRadius: 5,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
  },
  createButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  reorderButton: {
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowRadius: 6,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  reorderIconButtonContainer: {
    opacity: 1,
    position: 'absolute',
    right: 22,
  },
  reorderIconButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    shadowColor: theme.colors.shadow,
    shadowRadius: 6,
    shadowOpacity: .3,
    shadowOffset: { width: 0, height: 2 },
  },
  reorderIconButtonUp: {
    bottom: 132,
  },
  reorderIconButtonDown: {
    bottom: 80,
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
  },
  typeSelection: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 20,
    marginTop: 32,
  },
  typeIcon: {
    marginLeft: 8,
    marginRight: 4,
  },
  typeButton: {

  },
  typeLabel: {
    paddingHorizontal: 6,
    color: theme.colors.primary,
  },
  typeLabelDisabled: {
    paddingHorizontal: 6,
  },
  comboContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // marginTop: -4,
    marginBottom: 16,
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
  measurementActivity: {
    marginLeft: 4,
    flexShrink: 2,
  },
  measurementVariant: {
    color: theme.colors.outline,
    flexShrink: 1,
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

type MeasurementItemProps = {
  measurement: Measurement;
  habitCount: number,
  comboCount: number,
  selected?: boolean,
  onPress: (measurement: Measurement) => void,
  onArchive: (measurement: Measurement, archived: boolean) => void,
  onDelete: (measurement: Measurement) => void,
};

const MeasurementItem = (props: MeasurementItemProps): JSX.Element => {
  const { measurement,
    habitCount,
    comboCount,
    selected,
    onPress,
    onArchive,
    onDelete,
  } = props;

  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const theme = useTheme();
  const itemStyles = createItemStyles(theme);

  const typeData = getMeasurementTypeData(measurement.type);
  const hasHabits = habitCount !== 0;
  const hasCombos = comboCount !== 0;
  const isInactive = !hasHabits && !hasCombos;

  const color = isInactive ? theme.colors.outline : theme.colors.primary;
  return (
    <TouchableRipple style={[itemStyles.container, selected ? itemStyles.selectedContainer : {}]} onPress={() => { onPress(measurement); }}>
      <>
        <View style={itemStyles.typeIcon}>
          <Icon source={typeData.icon} size={28} color={color} />
        </View>
        <View style={itemStyles.content}>
          <View style={itemStyles.labelContainer}>
            <Text style={itemStyles.labelActivity} variant='titleMedium' numberOfLines={1} ellipsizeMode='tail'>
              {measurement.activity}
              </Text>
            {measurement.variant ? <Text style={itemStyles.labelDivider} variant='bodyMedium'> : </Text> : null}
            <Text style={itemStyles.labelVariant} variant='bodyLarge' numberOfLines={1} ellipsizeMode='tail'>
              {measurement.variant}
              </Text>
          </View>
          <View style={itemStyles.habitCountContainer}>
            {isInactive ? (
              <>
                <View style={itemStyles.habitCountIcon}>
                  <Icon source={Icons.warning} size={18} color={color} />
                </View>
                <Text variant='titleSmall' style={{ ...itemStyles.habitCountText, color }}>
                  Unused
                </Text>
              </>
            ) : null}
            {hasHabits ? (
              <>
                <View style={itemStyles.habitCountIcon}>
                  <Icon source={Icons.habitMultiple} size={18} color={color} />
                </View>
                <Text variant='titleSmall' style={{ ...itemStyles.habitCountText, color }}>
                  {habitCount} Habit{habitCount === 1 ? '' : 's'}
                </Text>
              </>
            ) : null}
            {hasCombos ? (
              <>
                <View style={itemStyles.habitCountIcon}>
                  <Icon source={Icons.measurementMultiple} size={18} color={color} />
                </View>
                <Text variant='titleSmall' style={{ ...itemStyles.habitCountText, color }}>
                  {comboCount} Combo{comboCount === 1 ? '' : 's'}
                </Text>
              </>
            ) : null}
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
  selectedContainer: {
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: 20,
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
    color: theme.colors.primary,
    lineHeight: 24,
    marginRight: 12,
  },
  menuButton: {
    marginLeft: 8,
    marginRight: 0,
  },
});

export default Measurements;