import { Portal, Dialog, Text, Button, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { hideImportDialog, confirmImportDialog } from '@s/authReducer';
import type { RootState } from '@t/redux';
import { auth } from '@/firebase';
import { StyleSheet } from 'react-native';

export const ImportDialog = () => {
  const dispatch = useDispatch();
  const visible = useSelector((state: RootState) => state.auth.showImportDialog);
  const theme = useTheme();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={() => dispatch(hideImportDialog())}>
        <Dialog.Title>Import Data</Dialog.Title>
        <Dialog.Content>
          <Text variant='bodyMedium'>
            This looks like a fresh account. Would you like to import your local data into
            <Text variant='labelLarge' style={{ paddingLeft: 4 }}>
              {auth.currentUser?.email}
            </Text>
            ?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => dispatch(hideImportDialog())}
            mode='text'
            textColor={theme.colors.onSurface}  
            contentStyle={s.dialogButton}
          >
            CANCEL
          </Button>
          <Button 
            onPress={() => {
              dispatch(confirmImportDialog());
              dispatch(hideImportDialog());
            }} 
            mode='text'
            textColor={theme.colors.onSurface}  
            contentStyle={s.dialogButton}
          >
            IMPORT
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}; 

const s = StyleSheet.create({
  dialogButton: {
    paddingHorizontal: 8,
  },
});