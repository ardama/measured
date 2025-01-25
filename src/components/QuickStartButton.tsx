import { Button, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { callGenerateSampleData } from '@s/dataReducer';
import { useMemo } from 'react';

type QuickStartButtonProps = {
  buttonText?: string;
  helperText?: string;
  showHelperText?: boolean;
}

const QuickStartButton = ({
  buttonText = "Quick start",
  helperText = "Get started with some common use cases",
  showHelperText = true
}: QuickStartButtonProps) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <View style={styles.container}>
      <Button
        style={styles.sampleDataButton}
        contentStyle={styles.sampleDataButtonContent}
        mode='contained'
        onPress={() => {
          dispatch(callGenerateSampleData());
        }}
      >
        <Text variant='labelLarge' style={styles.sampleDataButtonText}>
          {buttonText}
        </Text>
      </Button>
      {showHelperText && (
        <Text variant='bodyMedium' style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 120,
  },
  sampleDataButton: {
    width: 240,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sampleDataButtonContent: {
    paddingVertical: 4,
  },
  sampleDataButtonText: {
    color: theme.colors.inverseOnSurface,
    textTransform: 'uppercase',
  },
  helperText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
});

export default QuickStartButton; 