import ColorPicker from '@c/ColorPicker';
import Header from '@c/Header';
import { setAuthAction } from '@s/appReducer';
import { callUpdateAccount, callDeleteAll } from '@s/dataReducer';
import { useAccount } from '@s/selectors';
import type { AccountSettings } from '@t/users';
import { Icons } from '@u/constants/Icons';
import { useAuth } from '@u/hooks/useAuth';
import { usePalettes } from '@u/hooks/usePalettes';
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Icon, Portal, Switch, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

type SettingsItem = {
  icon?: string,
  title: string,
  control?: JSX.Element,
  onPress?: () => void,
}

type SettingsSection = {
  title: string,
  items: SettingsItem[],
}

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const theme = useTheme();
  const styles = createStyles(theme);
  const { globalPalette } = usePalettes();

  const account = useAccount();
  const darkMode = account.settings.darkMode;

  const [darkModeValue, setDarkModeValue] = useState(darkMode);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const darkModeChange = useRef<NodeJS.Timeout | null>(null);
  const handleDarkModeChange = (nextDarkMode: boolean) => {
    setDarkModeValue(nextDarkMode);
    if (darkModeChange.current) clearTimeout(darkModeChange.current);
    darkModeChange.current = setTimeout(() => {
      dispatch(callUpdateAccount({ ...account, settings: { ...account.settings, darkMode: nextDarkMode}}))
    }, 50);
  }

  useEffect(() => {
    if (darkMode !== darkModeValue) setDarkModeValue(darkMode);
  }, [darkMode]);

  const displayItems: SettingsItem[] = [
    {
      icon: Icons.darkMode,
      title: 'dark mode',
      control: <Switch
        color={globalPalette.primary}
        trackColor={{ true: globalPalette.backdrop, false: globalPalette.disabled }}
        value={darkModeValue}
        onValueChange={handleDarkModeChange}
      />,
      onPress: () => {
        handleDarkModeChange(!darkModeValue);
      },
    },
    {
      icon: Icons.palette,
      title: 'accent color',
      control: (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}>
          <ColorPicker value={account.settings.baseColor} onSelect={(nextColor) => {
            const nextSettings: AccountSettings = { ...account.settings, baseColor: nextColor };
            if (!nextColor) delete nextSettings['baseColor'];
            dispatch(callUpdateAccount({ ...account, settings: nextSettings }));
          }}/>
        </View>
      ),
    },
  ];
  const accountItems: SettingsItem[] = [
    {
      icon: user ? Icons.logout : Icons.login,
      title: user ? 'SIGN OUT' : 'CREATE ACCOUNT',
      onPress: () => {
        if (!user) dispatch(setAuthAction('signup'));
        router.push('/signout');
      },
      control: (
        <Text variant='bodyMedium' style={{ color: globalPalette.primary }}>{user?.email || 'Guest'}</Text>
      )
    },
  ];

  if (user) {
    accountItems.push({
      icon: Icons.delete,
      title: 'DELETE DATA',
      onPress: () => setShowDeleteAllDialog(true),
    });
  }

  const sections: SettingsSection[] = [
    {
      title: 'customize',
      items: displayItems,
    },
    {
      title: 'account',
      items: accountItems,
    },
  ]


  return (
    <>
      <Header
        title='Settings'
        bordered
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          {sections.map(({ title, items }) => {
            return (
              <React.Fragment key={title}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderTitle}>
                    <Text style={styles.sectionHeaderText} variant='labelLarge'>{title.toUpperCase()}</Text>
                  </View>
                </View>
                {items.map(({ icon, title, control, onPress }) => {
                  const content = (
                    <View style={styles.item} key={title}>
                      {!!icon && (
                        <View style={styles.itemIcon}>
                          <Icon source={icon} size={14} color={theme.colors.onSurface} />
                        </View>
                      )}
                      <Text style={styles.itemTitle} variant='labelLarge'>
                        {title.toUpperCase()}
                      </Text>
                      {!!control && <View style={styles.itemContent}>
                        {control}
                      </View>}
                    </View>
                  );
      
                  return onPress ? (
                    <TouchableRipple
                      key={title}
                      onPress={(e) => { e.stopPropagation(); onPress(); }}
                    >
                      {content}
                    </TouchableRipple>
                  ) : content
                })}
              </React.Fragment>
            )
          })}
        </ScrollView>
      </View>
      <Portal>
        <Dialog
          visible={showDeleteAllDialog}
          onDismiss={() => setShowDeleteAllDialog(false)}
        >
          <Dialog.Title>Delete Data</Dialog.Title>
          <Dialog.Content>
            <Text variant='bodyMedium'>
              Are you sure you want to delete your account data? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDeleteAllDialog(false)}
              mode='text'
              textColor={theme.colors.onSurface}
              contentStyle={styles.dialogButton}
            >
              CANCEL
            </Button>
            <Button
              onPress={() => {
                dispatch(callDeleteAll());
                setShowDeleteAllDialog(false);
              }}
              mode='text'
              textColor={theme.colors.error}
              contentStyle={styles.dialogButton}
            >
              DELETE
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContainer: {
    padding: 0,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: theme.colors.elevation.level3,
    minHeight: 48,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: theme.colors.elevation.level5,
    marginTop: -1,
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
  item: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: -1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: theme.colors.elevation.level3,
    minHeight: 48,

    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flexShrink: 0,
    marginRight: 8,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
  itemIcon: {
    marginRight: -2,
  },
  dialogButton: {
    paddingHorizontal: 8,
  },
});


export default Settings;