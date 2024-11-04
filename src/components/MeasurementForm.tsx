import BottomDrawer, { type BottomDrawerItem } from '@c/BottomDrawer';
import OptionButton from '@c/OptionButton';
import { CommonActions } from '@react-navigation/native';
import { callCreateMeasurement, callUpdateMeasurement } from '@s/dataReducer';
import { useMeasurements } from '@s/selectors';
import { getMeasurementOperatorData, getMeasurementTypeData, getMeasurementTypeIcon, measurementOperators, measurementTypes, type Measurement, type MeasurementOperator, type MeasurementRecording, type MeasurementType } from '@t/measurements';
import { Error, EmptyError, NoError } from '@u/constants/Errors';
import { formatValue } from '@u/helpers';
import { router, useNavigation } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, IconButton, Menu, Text, TextInput, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

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
};

export default function MeasurementForm({ measurement, formType } : MeasurementFormProps) {
  const dispatch = useDispatch();
  const measurements = useMeasurements();

  const [formMeasurement, setFormMeasurement] = useState<FormMeasurement>({
    ...measurement,
    step: measurement.step.toString(),
    initial: measurement.initial.toString(),
  });
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [isComboLeftMenuVisible, setIsComboLeftMenuVisible] = useState(false);
  const [isComboRightMenuVisible, setIsComboRightMenuVisible] = useState(false);
  const [isComboOperatorMenuVisible, setIsComboOperatorMenuVisible] = useState(false);

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

    const step = isBool ? 1 : isCombo ? 0 : parseFloat(formMeasurement.step);
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
    if (isNaN(initial) || !isFinite(initial) || initial < 0) return Error('Invalid initial value');
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

  const theme = useTheme();
  const s = createFormStyles(theme);
  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContainer}>
        <View style={s.content}>
          <View style={s.formSectionHeader}>
            <Text variant='labelMedium' style={s.labelTitle}>DATA TYPE</Text>
            <Text variant='bodySmall' style={s.labelSubtitle}>
              {`${isNew ? 'Select the' : 'The'} kind of data this measurement represents.`}
            </Text>
          </View>
          <View style={s.formSection}>
            {measurementTypes.map((type) => {
              const typeData = getMeasurementTypeData(type);
              const selected = type === formMeasurement.type;
              const disabled = !isNew && !selected;

              return (
                <OptionButton
                  key={type}
                  onPress={() => {
                    if (type === formMeasurement.type) return;
  
                    const nextMeasurement = { ...formMeasurement, type: type };
                    if (type === 'combo') {
                      nextMeasurement.comboOperator = nextMeasurement.comboOperator || '+',
                      nextMeasurement.comboLeftId = nextMeasurement.comboLeftId || measurements[0].id;
                      nextMeasurement.comboRightId = nextMeasurement.comboRightId || measurements[0].id;
                    } else if (type === 'time') {
                      nextMeasurement.step = '0.5';
                      nextMeasurement.initial = '12';
                    } else if (type === 'duration') {
                      nextMeasurement.step = '15';
                      nextMeasurement.unit = 'minutes'
                    }
                    handleFormEdit(nextMeasurement);
                  }}
                  selected={selected}
                  unselected={isUnset}
                  disabled={disabled}
                  icon={typeData.icon}
                  title={typeData.label.toUpperCase()}
                  subtitle={typeData.description}
                />
              );
            })}
          </View>
          {!isUnset && (
            <>
              <Divider style={s.formSectionDivider} />
              <View style={s.formSectionHeader}>
                <Text variant='labelMedium' style={s.labelTitle}>BASIC INFO</Text>
                <Text variant='bodySmall' style={s.labelSubtitle}>
                  {`Define what the measurement is called.`}
                </Text>
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
                />
              </View>
              <Divider style={s.formSectionDivider} />
              <View style={s.formSectionHeader}>
                <Text variant='labelMedium' style={s.labelTitle}>DATA VALUES</Text>
                <Text variant='bodySmall' style={s.labelSubtitle}>
                  {`Configure what values the measurement can take and how they are displayed.`}
                </Text>
              </View>
              <View style={s.formSection}>
                {isCombo ? (
                  <View style={s.comboContainer}>
                    <View style={{ flex: 1 }}>
                      <BottomDrawer
                        anchor={
                          <TouchableRipple
                          style={s.dropdownButton}
                          onPress={() => {
                            setIsComboLeftMenuVisible(true);
                          }}
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
                        visible={isComboLeftMenuVisible}
                        onDismiss={() => {
                          setIsComboLeftMenuVisible(false);
                        }}
                        items={comboMeasurementItems}
                        onSelect={(item) => {
                          const nextMeasurement = { ...formMeasurement, comboLeftId: item.value };
                          handleFormEdit(nextMeasurement);
                          setIsComboLeftMenuVisible(false);
                        }}
                        selectedItem={selectedLeftMeasurementItem}
                        />
                    </View>
                    <BottomDrawer
                      visible={isComboOperatorMenuVisible}
                      onDismiss={() => {
                        setIsComboOperatorMenuVisible(false);
                      }}
                      anchor={
                        <TouchableRipple
                        style={s.dropdownButton}
                        onPress={() => {
                          setIsComboOperatorMenuVisible(true);
                        }}
                        disabled={isBool}
                        >
                          <Text variant='titleSmall' style={s.operatorLabel}>
                            {getMeasurementOperatorData(formMeasurement.comboOperator).operator.toLowerCase()}
                          </Text>
                        </TouchableRipple>
                      }
                      items={comboOperatorItems}
                      selectedItem={selectedOperatorItem}
                      onSelect={(item) => {
                        const nextMeasurement = { ...formMeasurement, comboOperator: item.value as MeasurementOperator };
                        handleFormEdit(nextMeasurement);
                        setIsComboOperatorMenuVisible(false);
                      }}
                      />
                    <View style={{ flex: 1 }}>
                      <BottomDrawer
                        anchor={
                          <TouchableRipple
                          style={s.dropdownButton}
                          onPress={() => {
                            setIsComboRightMenuVisible(true);
                          }}
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
                        visible={isComboRightMenuVisible}
                        onDismiss={() => {
                          setIsComboRightMenuVisible(false);
                        }}
                        items={comboMeasurementItems}
                        onSelect={(item) => {
                          const nextMeasurement = { ...formMeasurement, comboRightId: item.value };
                          handleFormEdit(nextMeasurement);
                          setIsComboRightMenuVisible(false);
                        }}
                        selectedItem={selectedRightMeasurementItem}
                        />
                    </View>
                  </View>
                ) : null}
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
                />
                {!isCombo ? (
                  <TextInput
                    style={s.input}
                    mode='outlined'
                    placeholder='15, 1000, 100, 8'
                    placeholderTextColor={theme.colors.onSurfaceDisabled}
                    label='Increment amount'
                    value={isBool ? '--' : formMeasurement.step.toString() || ''}
                    error={saveAttempted && getStepErrors().hasError}
                    onChangeText={(text) => {
                      const nextMeasurement = { ...formMeasurement, step: text };
                      handleFormEdit(nextMeasurement);
                    }}
                    keyboardType="numeric"
                    disabled={isBool}
                    left={
                      isBool ? null :
                      <TextInput.Affix text={'+/-'} />
                    }
                    right={
                      isBool ? null :
                      isTime && formMeasurement.step ? <TextInput.Affix text={`(${(parseFloat(formMeasurement.step) * 60).toFixed(0)} minutes)`} /> :
                      unitString ? <TextInput.Affix text={unitString} /> :
                      null
                    }
                  />
                ) : null}
                
                {!isCombo ? (
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
                      (isTime || isDuration) && formMeasurement.initial ? <TextInput.Affix text={`(${formatValue(parseFloat(formMeasurement.initial), formMeasurement.type)})`} /> :
                      unitString ? <TextInput.Affix text={unitString} /> :
                      null
                    }
                  />
                ) : null}
              </View>
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
        >
          <Text variant='labelLarge' style={[s.buttonText, s.cancelButtonText]}>Discard</Text>
        </Button>
        <Button
          mode="text"
          style={s.button}
          contentStyle={s.buttonContent}
          labelStyle={s.buttonLabel}
          onPress={() => handleSave()}
          disabled={getTypeErrors().hasError}
        >
          <Text variant='labelLarge' style={{ ...s.buttonText, color: getTypeErrors().hasError ? theme.colors.onSurfaceDisabled : undefined }}>
            {isNew ? 'Create' : 'Save'}
          </Text>
        </Button>
      </View>
    </View>
  );
}

const createFormStyles = (theme: MD3Theme) => StyleSheet.create({
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
    paddingVertical: 24,
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
    backgroundColor: theme.colors.surfaceVariant,
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
    color: theme.colors.outline,
    flexShrink: 1,
  },
  operatorLabel: {
    width: 16,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  button: {
    flexGrow: 1,
    borderRadius: 0,
  },
  buttonContent: {
    height: 72,
    
  },
  buttonLabel: {
    borderRadius: 0,
  },
  buttonText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  cancelButton: {

  },
  cancelButtonContent: {
    borderRightWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  cancelButtonText: {
    color: theme.colors.onSurface,
  },
});