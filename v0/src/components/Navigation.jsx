import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useDispatch } from 'react-redux';
import { useActiveTab } from '@/store/selectors';
import { changeActiveTab } from '@/store/appReducer';


const tabs = [
  { name: 'home', icon: '🏠' },
  { name: 'search', icon: '🔍' },
  { name: 'profile', icon: '👤' },
]

/**
 * @typedef {Object} NavigationProps
 */

/**
 * @param {NavigationProps} props
 * @returns {JSX.Element}
 */
const Navigation = ({}) => {
  const dispatch = useDispatch();
  const activeTab = useActiveTab();

  return (
    <View style={styles.container}>
      <View style={styles.tabItems}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.name}
            style={[styles.tabItem, activeTab === tab.name && styles.activeTabItem]}
            onPress={() => dispatch(changeActiveTab(tab.name))}
          >
            <Text style={styles.tabItemIcon}>{tab.icon}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {},
    tabItems: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#f8f8f8',
      height: 60,
    },
    tabItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      lineHeight: 24,
      paddingVertical: 18,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    activeTabItem: {
      borderTopWidth: 1,
      borderTopColor: '#0077aff',
    },
    tabItemIcon: {
      fontSize: 24,
    },
})

export default Navigation;