import ColorPicker from '@c/ColorPicker';
import Header from '@c/Header';
import { callUpdateAccount } from '@s/dataReducer';
import { useAccount } from '@s/selectors';
import { usePalettes } from '@u/hooks/usePalettes';
import { router } from 'expo-router'
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Icon, Switch, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
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

  const theme = useTheme();
  const styles = createStyles(theme);
  const { globalPalette } = usePalettes();

  const account = useAccount();
  const darkMode = account.settings.darkMode;

  const displayItems: SettingsItem[] = [
    {
      icon: 'theme-light-dark',
      title: 'dark mode',
      control: <Switch color={globalPalette.primary} trackColor={{ true: globalPalette.backdrop, false: globalPalette.secondary }} value={account.settings.darkMode} />,
      onPress: () => {
        dispatch(callUpdateAccount({ ...account, settings: { ...account.settings, darkMode: !darkMode } }));
      },
    },
    {
      icon: 'palette',
      title: 'accent color',
      control: (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1, paddingLeft: 24 }}>
          <ColorPicker value={account.settings.baseColor} onSelect={(nextColor) => {
            const nextSettings = { ...account.settings, baseColor: nextColor };
            if (!nextColor) delete nextSettings['baseColor'];
            dispatch(callUpdateAccount({ ...account, settings: nextSettings }));
          }}/>
        </View>
      ),
    },
  ];
  const accountItems: SettingsItem[] = [
    {
      icon: 'logout',
      title: 'SIGN OUT',
      onPress: () => { router.push('/signout'); },
    },
  ];

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
                    <Text style={styles.sectionHeaderText} variant='labelMedium'>{title.toUpperCase()}</Text>
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
    </>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 0,
    flex: 1,
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
  sectionHeaderIcon: {
    marginRight: 8,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: -1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: theme.colors.surfaceVariant,
    minHeight: 48,

    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
    flexShrink: 1,
  },
  itemIcon: {
    
  },
});


export default Settings;