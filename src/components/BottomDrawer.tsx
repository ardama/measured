import React from 'react';
import AnimatedView from '@c/AnimatedView';
import type { Palette } from '@u/colors';
import { Icons } from '@u/constants/Icons';
import { usePalettes } from '@u/hooks/usePalettes';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import { Divider, Icon, IconButton, Modal, Portal, Searchbar, Text, useTheme, type MD3Theme } from 'react-native-paper';

type BottomDrawerProps<T> = {
  title: string
  anchor: JSX.Element
  selectedItem?: BottomDrawerItem<T> | null
  items: BottomDrawerItem<T>[]
  showSearchbar?: boolean
  placeholder?: string
  onSelect: (item: BottomDrawerItem<T>) => void
  palette?: Palette
  hideClose?: boolean
}

export type BottomDrawerItem<T> = {
  title: string
  subtitle?: string
  value: T
  icon?: string
  disabled?: boolean
}
export default function BottomDrawer<T>({ title, anchor, selectedItem, items, showSearchbar, placeholder, onSelect, palette, hideClose }: BottomDrawerProps<T>) {
  const theme = useTheme();
  const { globalPalette } = usePalettes();
  const colorPalette = palette || globalPalette;
  const styles = createStyles(theme, colorPalette);
  const [visible, setVisible] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searchbarFocused, setSearchbarFocused] = useState(false);
  const searchbarRef = useRef<TextInput>(null);

  const handleDismiss = () => {
    setVisible(false);
  };  
  const filteredItems = items.filter(({ title, value }) => {
    if (typeof value === 'string') {
      return (
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
      );
    } else if (typeof value === 'number') {
      return (
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
      )
    }
    return true;
  });
  const filteredItemsInverse = items.filter(({ title, value }) => {
    if (typeof value === 'string') {
      return !(
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
      );
    } else if (typeof value === 'number') {
      return !(
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
      )
    }
    return false;
  });

  const isSearchbarVisible = showSearchbar || (items.length > 7 && showSearchbar !== false);
  return (
    <>
      {React.cloneElement(anchor, {
        onPress: () => {
          setVisible(true);

          if (anchor.props.onPress) {
            anchor.props.onPress();
          }
        }
      })}
      <Portal>
        <Modal
          visible={visible}
          style={styles.modal}
          contentContainerStyle={styles.container}
          dismissable
          onDismiss={handleDismiss}
        >
          <AnimatedView style={styles.content} isEnd={visible} startY={80} endY={0} startOpacity={0} endOpacity={1} isSpring>
            <View style={styles.header}>
              <Text variant='titleMedium' style={styles.headerText}>{title}</Text>
              {!hideClose && <IconButton
                icon={Icons.close}
                size={22}
                style={styles.headerButton}
                iconColor={theme.colors.onSurfaceDisabled}
                onPress={() => handleDismiss()}
              />}
            </View>
            {isSearchbarVisible ? (
              <View style={styles.searchbarContainer}>
                <Searchbar
                  ref={searchbarRef}
                  style={[styles.searchbar, (searchbarFocused || !!searchText) && styles.searchbarFocused]}
                  value={searchText}
                  onChangeText={(text) => setSearchText(text)}
                  placeholder={placeholder !== undefined ? placeholder : 'Search items...'}
                  placeholderTextColor={theme.colors.onSurfaceDisabled}
                  iconColor={searchbarFocused ? undefined : theme.colors.onSurfaceDisabled}
                  onFocus={() => setSearchbarFocused(true) }
                  onBlur={() => setSearchbarFocused(false) }
                  clearIcon={Icons.close}
                  right={!!searchText ? undefined : () => null}
                />
              </View>
            ) : null}
            <ScrollView style={styles.scrollContainer}>
              {isSearchbarVisible && filteredItems.length === 0 ? (
                <View style={styles.noResults}>
                  <Icon source={Icons.warning} size={18} color={theme.colors.onSurfaceDisabled} />
                  <Text variant='bodyLarge' style={styles.noResultsText}>No matches</Text>
                </View>
              ) : null}
              {filteredItems.map((item) => {
                return (
                  <BottomDrawerItem
                    key={`${item.title}::${item.value}`}
                    item={item}
                    selected={item.value === selectedItem?.value}
                    onSelect={() => {
                      onSelect(item);
                      handleDismiss();
                    }}
                    palette={colorPalette}
                  />
                );
              })}
              {filteredItemsInverse.length ? (
                <Divider style={styles.divider} />
              ) : null}
              {filteredItemsInverse.map((item) => {
                return (
                  <BottomDrawerItem
                    key={`${item.title}::${item.value}`}
                    item={item}
                    selected={item.value === selectedItem?.value}
                    onSelect={() => { onSelect(item); handleDismiss(); }}
                    palette={colorPalette}
                  />
                );
              })}
            </ScrollView>
            </AnimatedView>
        </Modal>
      </Portal>
    </>
  );
};

type BottomDrawerItemProps<T> = {
  item: BottomDrawerItem<T>
  selected: boolean
  onSelect: (item: BottomDrawerItem<T>) => void
  palette: Palette
}
function BottomDrawerItem<T>({ item, selected, onSelect, palette }: BottomDrawerItemProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme, palette);

  return (
    <Pressable
      style={[styles.item, selected && styles.itemSelected, item.disabled && styles.itemDisabled]}
      disabled={item.disabled}
      onPress={() => {
        onSelect(item);
      }}
    >
      <View
        style={[styles.itemContent, selected ? styles.itemContentSelected : {}, item.disabled ? styles.itemContentDisabled : {}]}
      >
        {!!item.icon && <View style={styles.itemIcon}>
          <Icon source={item.icon} size={!!item.subtitle ? 22 : 18} color={item.disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface} />
        </View>}
        <View style={styles.itemTextContent}>
          <Text
            variant={selected || !!item.subtitle ? 'titleMedium': 'bodyLarge'}
            style={[styles.itemTitle, selected ? styles.itemSelectedTitle : {}, item.disabled ? styles.itemDisabledTitle : {}]}
          >
            {item.title}
          </Text>
          {!!item.subtitle && (
            <Text
              variant={selected ? 'bodyMedium': 'bodyMedium'}
              style={[styles.itemSubtitle, selected ? styles.itemSelectedSubtitle : {}, item.disabled ? styles.itemDisabledSubtitle : {}]}
            >
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const createStyles = (theme: MD3Theme, palette: Palette) => StyleSheet.create({
  modal: {
    margin: 0,
  },
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  content: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: theme.colors.surface,  
    overflow: 'hidden',
    
    boxShadow: `0px 0px 16px ${theme.colors.shadow}40`,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerText: {
    flexGrow: 1,
    flexShrink: 1,
    textTransform: 'uppercase',
    color: theme.colors.onSurfaceDisabled,
    paddingLeft: 20,
  },
  headerButton: {
   margin: 0,
   height: 40,
   width: 40,
  },
  searchbarContainer: {
    marginBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
  },
  searchbar: {
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  searchbarFocused: {
    backgroundColor: theme.colors.elevation.level3,
  },
  noResults: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16, 
    marginBottom: 12,
  },
  noResultsText: {
    color: theme.colors.onSurfaceDisabled,
    marginLeft: 16,
  },
  scrollContainer: {
    width: '100%',
    maxHeight: 600,
    paddingHorizontal: 16,
  },
  divider: {
    backgroundColor: theme.colors.surfaceDisabled,
    marginTop: 12,
    marginBottom: 24,
  },
  item: {
    borderRadius: 4,
    marginBottom: 12,
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderColor: 'transparent',
  },
  itemSelected: {
    backgroundColor: palette.backdrop,
  },
  itemDisabled: {
    
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContentSelected: {
    
  },
  itemContentDisabled: {

  },
  itemIcon: {
    marginRight: 16,
    
  },
  itemTextContent: {
    flexGrow: 1,
    flexShrink: 1,
  },
  itemTitle: {
  },
  itemSelectedTitle: {
  },
  itemDisabledTitle: {
    color: theme.colors.onSurfaceDisabled,
  },
  itemSubtitle: {
  },
  itemSelectedSubtitle: {
  },
  itemDisabledSubtitle: {
    color: theme.colors.onSurfaceDisabled,
  },
});