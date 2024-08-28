import { View, Text, StyleSheet } from 'react-native';


import { useActiveTab } from '@/store/selectors';
import ConfigurationView from '@component/ConfigurationView';
import HomeView from '@component/HomeView';

const homeContent = {name: 'home', content: <HomeView /> };
const searchContent = {name: 'search', content: <View><Text>search</Text></View> };
const profileContent = {name: 'profile', content: <ConfigurationView /> };

const contents = [
  homeContent,
  searchContent,
  profileContent,
]

/**
 * @typedef {Object} ContentProps
 */

/**
 * 
 * @param {ContentProps} props 
 * @returns {JSX.Element}
*/
const Content = ({}) => {
  const activeTab = useActiveTab();
  const contentObject = contents.find((c) => c.name === activeTab) || homeContent;
  return (
    <View style={styles.container}>
      {contentObject.content}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'blue',
  }
});

export default Content;