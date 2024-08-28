import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


import ConfigurationView from '@/components/ConfigurationView';
import HomeView from '@c/HomeView';
import { useActiveTab } from '@s/selectors';

const homeContent = {name: 'home', content: <HomeView /> };
const searchContent = {name: 'search', content: <View><Text>search</Text></View> };
const profileContent = {name: 'profile', content: <ConfigurationView /> };

const contents = [
  homeContent,
  searchContent,
  profileContent,
]

const Content = ({}: object): JSX.Element => {
  const activeTab = useActiveTab();
  return (
    <View style={styles.container}>
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