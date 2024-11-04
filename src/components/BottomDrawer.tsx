import AnimatedView from '@c/AnimatedView';
import { Icons } from '@u/constants/Icons';
import { forWeb } from '@u/helpers';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { Divider, Icon, Modal, Portal, Searchbar, Text, TouchableRipple, useTheme, type MD3Theme } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';

type BottomDrawerProps<T> = {
  anchor: JSX.Element,
  selectedItem?: BottomDrawerItem<T> | null,
  items: BottomDrawerItem<T>[],
  visible: boolean,
  showSearchbar?: boolean,
  placeholder?: string,
  onSelect: (item: BottomDrawerItem<T>) => void,
  onDismiss: () => void;
}

export type BottomDrawerItem<T> = {
  title: string,
  subtitle?: string,
  value: T,
  icon?: string,
  disabled?: boolean,
}
export default function BottomDrawer<T>({ anchor, selectedItem, items, visible, showSearchbar, placeholder, onSelect, onDismiss }: BottomDrawerProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [searchText, setSearchText] = useState('');
  const [searchbarFocused, setSearchbarFocused] = useState(false);
  const searchbarRef = useRef<TextInput>(null);

  const handleDismiss = () => {
    onDismiss();
  };

  const translateY = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      // Animate drawer sliding up
      translateY.value = withSpring(0, {
        damping: 40,
        mass: 0.5,
        stiffness: 100,
      });
      
      forWeb(
        () => setTimeout(() => {
          if (searchbarRef.current !== null) searchbarRef.current.focus();
        }, 0),
        () => {}
      )();
    } else {
      // Animate drawer sliding down
      translateY.value = withTiming(100, {
        duration: 200,
      });
    }
  }, [visible]);

  const filteredItems = items.filter(({ title, value }) => {
    if (typeof value === 'string') {
      return (
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
        || value.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
      );
    } else if (typeof value === 'number') {
      return (
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
        || `${value}`.indexOf(searchText) !== -1
      )
    }
    return true;
  });
  const filteredItemsInverse = items.filter(({ title, value }) => {
    if (typeof value === 'string') {
      return !(
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
        || value.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
      );
    } else if (typeof value === 'number') {
      return !(
        !searchText
        || title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
        || `${value}`.indexOf(searchText) !== -1
      )
    }
    return false;
  });

  const isSearchbarVisible = showSearchbar || (items.length > 7 && showSearchbar !== false);
  return (
    <>
      {anchor}
      <Portal>
        <Modal
          visible={visible}
          style={styles.modal}
          contentContainerStyle={styles.container}
          dismissable
          onDismiss={handleDismiss}
          
        >
            <AnimatedView style={styles.content} isEnd={visible} startY={50} isSpring>
            {isSearchbarVisible ? (
              <View style={styles.searchbarContainer}>
                <Searchbar
                  ref={searchbarRef}
                  style={styles.searchbar}
                  value={searchText}
                  onChangeText={(text) => setSearchText(text)}
                  placeholder={placeholder !== undefined ? placeholder : 'Search items...'}
                  placeholderTextColor={theme.colors.onSurfaceDisabled}
                  iconColor={searchbarFocused ? undefined : theme.colors.onSurfaceDisabled}
                  onFocus={() => setSearchbarFocused(true) }
                  onBlur={() => setSearchbarFocused(false) }
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
                    onSelect={() => { onSelect(item); handleDismiss(); }}
                  />
                );
              })}
              {filteredItemsInverse.length ? (
                <Divider horizontalInset style={styles.divider} />
              ) : null}
              {filteredItemsInverse.map((item) => {
                return (
                  <BottomDrawerItem
                    key={`${item.title}::${item.value}`}
                    item={item}
                    selected={item.value === selectedItem?.value}
                    onSelect={() => { onSelect(item); handleDismiss(); }}
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
  item: BottomDrawerItem<T>,
  selected: boolean,
  onSelect: (item: BottomDrawerItem<T>) => void,
}
function BottomDrawerItem<T>({ item, selected, onSelect }: BottomDrawerItemProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableRipple
      onPress={() => onSelect(item)}
      style={[styles.item, selected ? styles.itemSelected : {}, item.disabled ? styles.itemDisabled : {}]}
      disabled={item.disabled}
    >
      <View
        style={[styles.itemContent, selected ? styles.itemContentSelected : {}, item.disabled ? styles.itemContentDisabled : {}]}
      >
        {item.icon ? <Icon source={item.icon} size={!!item.subtitle ? 22 : 18} color={item.disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface} /> : null}
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
    </TouchableRipple>
  )
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  modal: {
    margin: 0,
  },
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    // shadowColor: 'transparent',
  },
  content: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.colors.elevation.level1,  
    
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    paddingTop: 20, 
    transform: [{ translateY: 100 }],
  },
  searchbarContainer: {
    marginBottom: 16,
    paddingHorizontal: 18,
  },
  searchbar: {
    borderRadius: 12,
  },
  noResults: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20, 
  },
  noResultsText: {
    color: theme.colors.onSurfaceDisabled,
    marginLeft: 8,
  },
  scrollContainer: {
    width: '100%',
    maxHeight: 400,
  },
  divider: {
    backgroundColor: theme.colors.surfaceDisabled,
    marginVertical: 12,
  },
  item: {
  },
  itemSelected: {
    backgroundColor: 'rgba(23, 29, 30, 0.06)',
  },
  itemDisabled: {
    
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20, 
    paddingHorizontal: 20, 
    
  },
  itemContentSelected: {
    
  },
  itemContentDisabled: {

  },
  itemTextContent: {
    marginLeft: 16,
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