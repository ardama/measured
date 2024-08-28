import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useDispatch } from 'react-redux';
import { changeActiveTab } from '@store/appReducer';
import { useActiveTab } from '@store/selectors';


const tabs = [
  { index: 0, icon: '🏠' },
  { index: 1, icon: '🔍' },
  { index: 2, icon: '👤' },
]

const Navigation = ({}: object): JSX.Element => {
  const dispatch = useDispatch();
  const activeTab = useActiveTab();

  return (
    <View style={styles.container}>
      <View style={styles.tabItems}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.index}
            style={[styles.tabItem, activeTab === tab.index && styles.activeTabItem]}
            onPress={() => dispatch(changeActiveTab(tab.index))}
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