import BottomDrawer, { type BottomDrawerItem } from '@c/BottomDrawer';
import ColorPicker from '@c/ColorPicker';
import Header from '@c/Header';
import OptionButton from '@c/OptionButton';
import { callCreateMeasurement, callDeleteMeasurement, callUpdateMeasurement } from '@s/dataReducer';
import { useMeasurements, useMeasurementUsage } from '@s/selectors';
import { getMeasurementOperatorData, getMeasurementTypeData, getMeasurementTypeIcon, measurementOperators, measurementTypes, type Measurement, type MeasurementOperator, type MeasurementRecording, type MeasurementType } from '@t/measurements';
import { type BaseColor, type Palette } from '@u/colors';
import { Error, EmptyError, NoError } from '@u/constants/Errors';
import { Icons } from '@u/constants/Icons';
import { formatValue, parseTimeString, formatTimeValue, parseTimeValue, computeTimeValue } from '@u/helpers';
import { usePalettes } from '@u/hooks/usePalettes';
import { router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { Keyboard, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Button, Dialog, Divider, Icon, Portal, Text, TextInput, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';

type MeasurementFormProps = {
  measurement: Measurement,
  formType: 'create' | 'edit',
}

type FormMeasurement = {
  step: string;
  id: string;
  userId: string;
  type: MeasurementType;
  name: string;
  variant: string;
  unit: string;
  archived: boolean;
  initial: string,
  priority: number,
  comboLeftId?: string,
  comboRightId?: string,
  comboOperator?: MeasurementOperator,
  recordings: MeasurementRecording[],
  hue?: number
  baseColor?: BaseColor,
};

export default function MeasurementForm({ measurement, formType } : MeasurementFormProps) {
  const dispatch = useDispatch();
  const measurements = useMeasurements();

  const [formMeasurement, setFormMeasurement] = useState<FormMeasurement>({
    ...measurement,
    step: measurement.type === 'time' ? (measurement.step * 60).toString() : measurement.step.toString(),
    initial: measurement.initial.toString(),
  });
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [isComboLeftMenuVisible, setIsComboLeftMenuVisible] = useState(false);
  const [isComboRightMenuVisible, setIsComboRightMenuVisible] = useState(false);
  const [isComboOperatorMenuVisible, setIsComboOperatorMenuVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const isNew = formType === 'create';

  const isUnset = formMeasurement.type === '';
  const isDuration = formMeasurement.type === 'duration';
  const isBool = formMeasurement.type === 'bool';
  const isTime = formMeasurement.type === 'time';
  const isCombo = formMeasurement.type === 'combo';

  const comboLeftMeasurement = measurements.find(({ id }) => id === formMeasurement.comboLeftId);
  const comboRightMeasurement = measurements.find(({ id }) => id === formMeasurement.comboRightId);

  const handleFormEdit = (nextMeasurement: FormMeasurement) => {
    setFormMeasurement(nextMeasurement);
  }

  const handleAddMeasurement = (newMeasurement: Measurement) => {
    dispatch(callCreateMeasurement(newMeasurement));
  }

  const handleEditMeasurement = (newMeasurement: Measurement) => {
    dispatch(callUpdateMeasurement(newMeasurement));
  }

  const handleFormClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  const handleSave = () => {
    if (hasErrors()) {
      setSaveAttempted(true);
      return;
    }

    const step = isBool ? 1 : isCombo ? 0 : isTime ? parseFloat(formMeasurement.step) / 60 : parseFloat(formMeasurement.step);
    const unit = isBool || isTime || isDuration ? '' : formMeasurement.unit;
    const initial = isBool ? 0 : parseFloat(formMeasurement.initial);
    const comboLeftId = isCombo ? formMeasurement.comboLeftId : undefined;
    const comboRightId = isCombo ? formMeasurement.comboRightId : undefined;
    const comboOperator = isCombo ? formMeasurement.comboOperator : undefined;
    const nextMeasurement = {
      ...formMeasurement,
      name: formMeasurement.name.trim(),
      variant: formMeasurement.variant.trim(),
      type: formMeasurement.type || 'duration',
      unit,
      step,
      initial,
      comboLeftId,
      comboRightId,
      comboOperator,
    };

    isNew ? handleAddMeasurement(nextMeasurement) : handleEditMeasurement(nextMeasurement);
    handleFormClose();
  };

  const handleCancel = () => {
    handleFormClose();
  }

  const hasErrors = () => {
    if (getTypeErrors().hasError) return true;
    if (getNameErrors().hasError) return true;
    if (getVariantErrors().hasError) return true;
    if (getStepErrors().hasError) return true;
    if (getInitialErrors().hasError) return true;
    if (getUnitErrors().hasError) return true;
    return false
  }

  const getTypeErrors = () => {
    return formMeasurement.type ? NoError : EmptyError;
  }

  const getNameErrors = () => {
    return formMeasurement.name ? NoError : EmptyError;
  }

  const getVariantErrors = () => {
    return NoError;
  }

  const getColorErrors = () => {
    return NoError;
  }
  
  const getStepErrors = () => {
    if (isBool) return NoError;
    if (isCombo) return NoError;
    if (!formMeasurement.step) return EmptyError;
    const step = parseFloat(formMeasurement.step);
    if (isNaN(step) || !isFinite(step) || step < 0) return Error('Invalid step value');
    return NoError;
  }
  
  const getInitialErrors = () => {
    if (isBool) return NoError;
    if (isCombo) return NoError;
    if (!formMeasurement.initial) return EmptyError;
    const initial = parseFloat(formMeasurement.initial);
    if (isNaN(initial) || !isFinite(initial)) return Error('Invalid initial value');
    return NoError;
  }
  
  const getUnitErrors = () => {
    return NoError;
  }

  const comboMeasurementItems: BottomDrawerItem<string>[] = measurements.map((measurement) => ({
    value: measurement.id,
    title: `${measurement.name}${measurement.variant ? ` : ${measurement.variant}` : ''}`,
    icon: getMeasurementTypeIcon(measurement.type),
    disabled: measurement.id === formMeasurement.id || measurement.type === 'bool',
  }));

  const selectedLeftMeasurementItem = comboMeasurementItems.find(({ value }) => value === formMeasurement.comboLeftId) || null;
  const selectedRightMeasurementItem = comboMeasurementItems.find(({ value }) => value === formMeasurement.comboRightId) || null;

  const comboOperatorItems: BottomDrawerItem<string>[] = measurementOperators.map((operator) => ({
    value: operator,
    title: getMeasurementOperatorData(operator).action,
    icon: getMeasurementOperatorData(operator).icon,
  }));

  const selectedOperatorItem = comboOperatorItems.find(({ value }) => value === formMeasurement.comboOperator) || null;  
  const unitString = isDuration ? 'minutes' : isBool ? '--' : isTime ? 'hours' : formMeasurement.unit;

  const initialValueWithoutOffset = (24 + (parseFloat(formMeasurement.initial) % 24)) % 24;
  const [timeValueString, setTimeValueString] = useState(formatTimeValue(initialValueWithoutOffset));
  const [timeOffsetString, setTimeOffsetString] = useState(Math.floor(parseFloat(formMeasurement.initial) / 24).toFixed(0));

  const measurementUsage = useMeasurementUsage();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [deletionTarget, setDeletionTarget] = useState<Measurement | null>(null);
  const deletionTargetUsage = deletionTarget && measurementUsage.get(deletionTarget.id);
  const canDelete = (
    !deletionTargetUsage?.habits.length
    && !deletionTargetUsage?.pastHabits.length
    && !deletionTargetUsage?.measurements.length
  );

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuItems: BottomDrawerItem<string>[] = [
    {
      icon: measurement.archived ? Icons.show : Icons.hide,
      title: `${measurement.archived ? 'Unarchive' : 'Archive'}`,
      subtitle: measurement.archived ? 'Restore visibility of this measurement.' : 'Hide this measurement but preserve its data.',
      value: 'archive',
    },
    {
      icon: Icons.delete,
      title: 'Delete',
      value: 'delete',
      subtitle: 'Permanently delete this measurement and all of its data. Cannot be deleted if referenced by any habits or combo measurements.',
      disabled: !canDelete,
    }
  ];

  const handleDeleteMeasurement = (measurement: Measurement) => {
    setDeletionTarget(measurement);
    setIsDialogVisible(true);
  };

  const handleConfirmDeleteMeasurement = (measurement: Measurement | null) => {
    setIsDialogVisible(false);
    setDeletionTarget(null);
    
    setTimeout(() => {
      if (measurement) dispatch(callDeleteMeasurement(measurement))
      router.canGoBack() ? router.back() : router.push('/');
    }, 0);
  };

  const handleArchiveMeasurement = (measurement: Measurement, archived: boolean) => {
    const nextMeasurement = { ...formMeasurement, archived: archived };
    handleFormEdit(nextMeasurement);
    dispatch(callUpdateMeasurement({ ...measurement, archived }));
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours() + selectedDate.getMinutes() / 60;
      const offset = parseInt(timeOffsetString) || 0;
      const nextMeasurement = { ...formMeasurement, initial: computeTimeValue(hours, offset).toString() };
      handleFormEdit(nextMeasurement);
      setTimeValueString(formatTimeValue(hours));
    }
  };

  const theme = useTheme();
  const { getCombinedPalette } = usePalettes();
  const palette = useMemo(() => getCombinedPalette(formMeasurement.baseColor), [formMeasurement.baseColor]);
  const s = useMemo(() => createFormStyles(theme, palette), [theme, palette]);

  useEffect(() => {
    if (isTime && formMeasurement.initial) {
      const { hours, offset } = parseTimeValue(parseFloat(formMeasurement.initial));
      setTimeValueString(formatTimeValue(hours));
      setTimeOffsetString(offset.toString());
    }
  }, []);

  const dataTypeOptions = useMemo(() => {
    return (
      <View style={s.formSection}>
        {measurementTypes.map((type) => {
          const typeData = getMeasurementTypeData(type);
          const selected = type === formMeasurement.type;
          if (!isNew && !selected) return null;
          const disabled = type === 'combo' && !measurements.length;

          return (
            <OptionButton
              key={type}
              onPress={() => {
                if (type === formMeasurement.type) return;

                const nextMeasurement = { ...formMeasurement, type, step: '', unit: '', initial: '' };
                if (type === 'combo') {
                  nextMeasurement.comboOperator = nextMeasurement.comboOperator || '+',
                  nextMeasurement.comboLeftId = nextMeasurement.comboLeftId || measurements[0]?.id;
                  nextMeasurement.comboRightId = nextMeasurement.comboRightId || measurements[1]?.id || measurements[0]?.id;
                } else if (type === 'time') {
                  nextMeasurement.step = '30';
                  nextMeasurement.initial = '12';
                  nextMeasurement.unit = 'hours';
                } else if (type === 'duration') {
                  nextMeasurement.step = '15';
                  nextMeasurement.initial = '0';
                  nextMeasurement.unit = 'minutes';
                }
                handleFormEdit(nextMeasurement);
              }}
              selected={selected}
              unselected={isUnset}
              disabled={disabled}
              icon={typeData.icon}
              title={typeData.label.toUpperCase()}
              subtitle={typeData.examples}
              palette={palette}
            />
          );
        })}
      </View>
    )
  }, [formMeasurement.type, palette]);

  return (
    <>
      <Header
        showBackButton
        title={isNew ? 'Create measurement' : `${measurement.name}`}
        subtitle={measurement.variant ? ` : ${measurement.variant}` : ''}
        actionContent={isNew ? null :
          <BottomDrawer
            title='Manage'
            anchor={
              <Button
                mode='text'
                textColor={theme.colors.onSurface}
                style={{ borderRadius: 4 }}
              >
                MANAGE
              </Button>
            }
            items={menuItems}
            onSelect={(item) => {
              if (item.value === 'archive') {
                setTimeout(() => {
                  handleArchiveMeasurement(measurement, !measurement.archived);
                }, 200);
              } else {
                handleDeleteMeasurement(measurement);
              }
            }}
          />
        }
      />
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.scrollContainer}>
          <View style={s.content}>
            <View style={s.formSectionHeader}>
              <Text variant='labelLarge' style={s.labelTitle}>DATA TYPE</Text>
              {isNew && <Text variant='bodyMedium' style={s.labelSubtitle}>
                {`What kind of data do you want to track?`}
              </Text>}
            </View>
            {dataTypeOptions}
            {!!formMeasurement.type && (
              <>
                <Divider style={s.formSectionDivider} />
                <View style={s.formSectionHeader}>
                  <Text variant='labelLarge' style={s.labelTitle}>BASIC INFO</Text>
                  {isNew && <Text variant='bodyMedium' style={s.labelSubtitle}>
                    {`What do you want to call this measurement?`}
                  </Text>}
                </View>
                <View style={s.formSection}>
                  <TextInput
                    label='Name'
                    placeholder='Read, Work out, Study'
                    placeholderTextColor={theme.colors.onSurfaceDisabled}
                    style={s.input}
                    mode='outlined'
                    error={saveAttempted && getNameErrors().hasError}
                    value={formMeasurement.name || ''}
                    onChangeText={(text) => {
                      const nextMeasurement = { ...formMeasurement, name: text };
                      handleFormEdit(nextMeasurement);
                    }}
                    activeOutlineColor={palette.primary || undefined}
                    />
                  <TextInput
                    label='Variant (optional)'
                    placeholder='Nonfiction, Cardio, Biology'
                    placeholderTextColor={theme.colors.onSurfaceDisabled}
                    style={s.input}
                    mode='outlined'
                    error={saveAttempted && getVariantErrors().hasError}
                    value={formMeasurement.variant || ''}
                    onChangeText={(text) => {
                      const nextMeasurement = { ...formMeasurement, variant: text };
                      handleFormEdit(nextMeasurement);
                    }}
                    activeOutlineColor={palette.primary || undefined}
                  />
                  <View style={{ marginTop: 8 }}>
                    <ColorPicker
                      value={formMeasurement.baseColor}
                      onSelect={(nextColor) => {
                        const nextMeasurement = { ...formMeasurement, baseColor: nextColor };
                        handleFormEdit(nextMeasurement);
                      }}
                    />
                  </View>
                </View>
              </>
            )}
            {!isUnset && (
              <>
                {!isBool && <>
                  <Divider style={s.formSectionDivider} />
                  <View style={s.formSectionHeader}>
                    <Text variant='labelLarge' style={s.labelTitle}>DATA VALUES</Text>
                    {isNew && <Text variant='bodyMedium' style={s.labelSubtitle}>
                      {`What values can the measurement take and how they are formatted?`}
                    </Text>}
                  </View>
                  <View style={s.formSection}>
                    {isCombo ? (
                      <View style={s.comboContainer}>
                        <View style={{ flex: 1 }}>
                          <BottomDrawer
                            title='Left measurement'
                            anchor={
                              <TouchableRipple
                                style={s.dropdownButton}
                              >
                                <>
                                  <Icon source={getMeasurementTypeIcon(comboLeftMeasurement?.type)} size={16} />
                                  <Text ellipsizeMode='tail' variant='titleSmall' numberOfLines={1} style={s.measurementName}>
                                    {comboLeftMeasurement?.name}
                                  </Text>
                                  {comboLeftMeasurement?.variant ? (
                                    <Text ellipsizeMode='tail'  numberOfLines={1} variant='bodyMedium' style={s.measurementVariant}> : {comboLeftMeasurement?.variant}</Text>
                                  ) : null}
                                </>
                              </TouchableRipple>
                            }
                            items={comboMeasurementItems}
                            onSelect={(item) => {
                              const nextMeasurement = { ...formMeasurement, comboLeftId: item.value };
                              handleFormEdit(nextMeasurement);
                            }}
                            selectedItem={selectedLeftMeasurementItem}
                            palette={palette}
                            />
                        </View>
                        <BottomDrawer
                          title='Operator'
                          anchor={
                            <TouchableRipple
                              style={s.dropdownButton}
                              disabled={isBool}
                            >
                              <Text variant='bodyMedium' style={s.operatorLabel}>
                                {getMeasurementOperatorData(formMeasurement.comboOperator).operator.toLowerCase()}
                              </Text>
                            </TouchableRipple>
                          }
                          items={comboOperatorItems}
                          selectedItem={selectedOperatorItem}
                          onSelect={(item) => {
                            const nextMeasurement = { ...formMeasurement, comboOperator: item.value as MeasurementOperator };
                            handleFormEdit(nextMeasurement);
                          }}
                          palette={palette}
                        />
                        <View style={{ flex: 1 }}>
                          <BottomDrawer
                            title='Right measurement'
                            anchor={
                              <TouchableRipple
                                style={s.dropdownButton}
                              >
                                <>
                                  <Icon source={getMeasurementTypeIcon(comboRightMeasurement?.type)} size={16} />
                                  <Text ellipsizeMode='tail' variant='titleSmall' numberOfLines={1} style={s.measurementName}>
                                    {comboRightMeasurement?.name}
                                  </Text>
                                  {comboRightMeasurement?.variant ? (
                                    <Text ellipsizeMode='tail'  numberOfLines={1} variant='bodyMedium' style={s.measurementVariant}> : {comboRightMeasurement?.variant}</Text>
                                  ) : null}
                                </>
                              </TouchableRipple>
                            }
                            items={comboMeasurementItems}
                            onSelect={(item) => {
                              const nextMeasurement = { ...formMeasurement, comboRightId: item.value };
                              handleFormEdit(nextMeasurement);
                            }}
                            selectedItem={selectedRightMeasurementItem}
                            palette={palette}
                          />
                        </View>
                      </View>
                    ) : null}
                    {!(isTime || isDuration) &&
                      <TextInput
                        style={s.input}
                        mode='outlined'
                        label='Unit (optional)'
                        placeholder='minutes, steps, calories, oz'
                        placeholderTextColor={theme.colors.onSurfaceDisabled}
                        value={unitString}
                        onChangeText={(text) => {
                          const nextMeasurement = { ...formMeasurement, unit: text };
                          handleFormEdit(nextMeasurement);
                        }}
                        disabled={isBool || isTime || isDuration}
                        error={saveAttempted && getUnitErrors().hasError}
                        activeOutlineColor={palette.primary || undefined}
                      />
                    }
                    {isTime ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TextInput
                          style={[s.input, { flexGrow: 1, flexShrink: 1 }]}
                          mode='outlined'
                          label='Daily starting value'
                          value={timeValueString}
                          placeholder="12:00pm"
                          error={saveAttempted && getInitialErrors().hasError}
                          onFocus={() => {
                            if (Platform.OS !== 'web') {
                              Keyboard.dismiss();
                              setShowTimePicker(true);
                            }
                          }}
                          onChangeText={(text) => {
                            if (Platform.OS !== 'web') return;

                            setTimeValueString(text);
                            const parsedTime = parseTimeString(text) || { hours: 12, offset: 0 };
                            const offset = parseInt(timeOffsetString) || 0;
                            const nextMeasurement = { ...formMeasurement, initial: computeTimeValue(parsedTime.hours, offset).toString() };
                            handleFormEdit(nextMeasurement);
                          }}
                          onBlur={() => {
                            if (Platform.OS !== 'web') return;

                            const parsedTime = parseTimeString(timeValueString) || { hours: 12, offset: 0 };
                            const offset = parseInt(timeOffsetString) || 0;
                            const nextMeasurement = { ...formMeasurement, initial: computeTimeValue(parsedTime.hours, offset).toString() };
                            handleFormEdit(nextMeasurement);
                            setTimeValueString(formatTimeValue(parsedTime.hours));
                          }}
                          activeOutlineColor={palette.primary || undefined}
                          showSoftInputOnFocus={Platform.OS === 'web'}
                        />
                        <TextInput
                          style={[s.input, { width: 100, flexShrink: 0 }]}
                          mode='outlined'
                          label='Offset'
                          value={timeOffsetString}
                          error={saveAttempted && getInitialErrors().hasError}
                          activeOutlineColor={palette.primary || undefined}
                          keyboardType="numeric"
                          right={
                            <TextInput.Affix text={`days`} />
                          }
                          onChangeText={(text) => {
                            setTimeOffsetString(text);
                            
                            const offset = parseInt(text) || 0;
                            const { hours } = parseTimeValue(parseFloat(formMeasurement.initial));
                            const nextMeasurement = { ...formMeasurement, initial: computeTimeValue(hours, offset).toString() };
                            handleFormEdit(nextMeasurement);
                          }}
                          onBlur={() => {
                            const offset = parseInt(timeOffsetString) || 0;
                            setTimeOffsetString(offset.toString());

                            const { hours } = parseTimeValue(parseFloat(formMeasurement.initial));
                            const nextMeasurement = { ...formMeasurement, initial: computeTimeValue(hours, offset).toString() };
                            handleFormEdit(nextMeasurement);
                          }}
                        />
                      </View>
                    ) : !isCombo && (
                      <TextInput
                        style={s.input}
                        mode='outlined'
                        label='Daily starting value'
                        value={isBool ? 'No' : formMeasurement.initial}
                        error={saveAttempted && getInitialErrors().hasError}
                        onChangeText={(text) => {
                          const nextMeasurement = { ...formMeasurement, initial: text };
                          handleFormEdit(nextMeasurement);
                        }}
                        disabled={isBool}
                        right={
                          isBool ? null :
                          isDuration && formMeasurement.initial ? <TextInput.Affix text={`(${formatValue(parseFloat(formMeasurement.initial), formMeasurement.type)})`} /> :
                          unitString ? <TextInput.Affix text={unitString} /> :
                          null
                        }
                        activeOutlineColor={palette.primary || undefined}
                        keyboardType="numeric"
                      />
                    )}
                    {!isCombo && (
                      <TextInput
                        style={s.input}
                        mode='outlined'
                        placeholder='15, 1000, 100, 8'
                        placeholderTextColor={theme.colors.onSurfaceDisabled}
                        label='Increment amount'
                        value={formMeasurement.step}
                        error={saveAttempted && getStepErrors().hasError}
                        onChangeText={(text) => {
                          const nextMeasurement = { ...formMeasurement, step: text };
                          handleFormEdit(nextMeasurement);
                        }}
                        keyboardType="numeric"
                        left={
                          <TextInput.Affix text={'+/-'} />
                        }
                        right={
                          isTime ? <TextInput.Affix text={`minutes`} /> :
                          unitString ? <TextInput.Affix text={unitString} /> :
                          null
                        }
                        activeOutlineColor={palette.primary || undefined}
                      />
                    )}
                  </View>
                </>}
              </>
            )}
          </View>
        </ScrollView>
        <View style={s.buttons}>
          <Button
            mode="text"
            style={[s.button, s.cancelButton]}
            contentStyle={[s.buttonContent, s.cancelButtonContent]}
            labelStyle={s.buttonLabel}
            onPress={() => handleCancel()}
            textColor={theme.colors.onSurface}
          >
            <Text variant='labelLarge' style={[s.buttonText, s.cancelButtonText]}>{isNew ? 'Discard' : 'Cancel'}</Text>
          </Button>
          <Button
            mode="text"
            style={s.button}
            contentStyle={s.buttonContent}
            labelStyle={s.buttonLabel}
            onPress={() => handleSave()}
            textColor={palette.primary}
            disabled={saveAttempted && hasErrors()}
          >
            <Text variant='labelLarge' style={[s.buttonText, saveAttempted && hasErrors() ? { color: theme.colors.onSurfaceDisabled } : {}]}>
              {isNew ? 'Create' : 'Save'}
            </Text>
          </Button>
        </View>
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
              contentStyle={s.dialogButton}
              onPress={() => setIsDialogVisible(false)}
              mode='text'
              textColor={theme.colors.onSurface}
            >
              {canDelete ? 'CANCEL' : 'CLOSE'}
            </Button>
            {canDelete &&
              <Button
                contentStyle={s.dialogButton}  
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
      {showTimePicker && (
        <DateTimePicker
          value={new Date(2000, 0, 1, parseInt(formMeasurement.initial), (parseFloat(formMeasurement.initial) % 1) * 60)}
          mode="time"
          onChange={handleTimeChange}
          display="spinner"
          minuteInterval={5}
        />
      )}
    </>
  );
}

const createFormStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  container: {
    width: '100%',
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 72,
  },
  scrollContainer: {
    paddingVertical: 16,
    width: '100%',
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 600,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formSectionHeader: {
    gap: 4,
    marginBottom: 12,
  },
  formSectionDivider: {
    backgroundColor: theme.colors.surfaceDisabled,
    marginVertical: 32,
  },
  formSection: {
    gap: 12,
  },
  labelTitle: {
    
  },
  labelSubtitle: {
    
  },
  input: {

  },
  typeSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  typeSelectionText: {
    flexShrink: 1,

  },
  typeIcon: {
  },
  typeButtonContent: {
    width: 150,
  },
  typeLabel: {
    paddingHorizontal: 6,
    color: theme.colors.onSurface,
  },
  typeLabelDisabled: {
    paddingHorizontal: 6,
  },
  comboContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: palette.backdrop,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    borderRadius: 4,
    flexShrink: 1,
  },
  measurementName: {
    marginLeft: 4,
    flexShrink: 2,
  },
  measurementVariant: {
    flexShrink: 1,
  },
  operatorLabel: {
    width: 16,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 32,
    marginVertical: -6,
  },
  buttons: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.elevation.level2,
  },
  button: {
    flexGrow: 1,
    borderRadius: 0,
  },
  buttonContent: {
    height: 80,
    
  },
  buttonLabel: {
    borderRadius: 0,
  },
  buttonText: {
    fontSize: 16,
    color: palette.primary,
  },
  cancelButton: {

  },
  cancelButtonContent: {

  },
  cancelButtonText: {
    color: theme.colors.onSurface,
  },
  dialogButton: {
    paddingHorizontal: 8,
  }
});