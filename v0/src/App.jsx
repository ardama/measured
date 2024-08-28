import { View, Text, StyleSheet } from 'react-native';
import { Provider, useDispatch } from 'react-redux';

import Content from '@component/Content';
import Navigation from '@component/Navigation';

import { store } from '@s/utils';

import { enableMapSet } from 'immer';
import { BottomNavigation, PaperProvider } from 'react-native-paper';
import { useActiveTab } from '@s/selectors';
import { useState } from 'react';
import { changeActiveTab } from '@s/appReducer';
import ConfigurationView from '@component/ConfigurationView';
import HomeView from '@component/HomeView';

// Enable the MapSet plugin for Immer

/**
 * @returns {JSX.Element} The rendered App component
*/
function App() {
  enableMapSet();

  const dispatch = useDispatch();
  const activeTab = useActiveTab();
  const [routes] = useState([
    { key: 'measurements', title: 'Measurements', focusedIcon: 'pencil-ruler', unfocusedIcon: 'pencil-ruler-outline'},
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline'},
    { key: 'history', title: 'History', focusedIcon: 'chart-box-multiple', unfocusedIcon: 'chart-box-multiple-outline'},
  ]);

  const renderScene = BottomNavigation.SceneMap({
    measurements: () => <ConfigurationView />,
    home: () => <HomeView />,
    history: () => <Text>HISTORY</Text>,
  })

  return (
    <Provider store={store}>
      <PaperProvider>
        <View style={styles.container}>
          <BottomNavigation
            navigationState={{ index: activeTab, routes }}
            onIndexChange={(index) => { dispatch(changeActiveTab(index)); }}
            renderScene={renderScene}
          />
        </View>
      </PaperProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    justifyContent: 'center',
  },
});

export default App;