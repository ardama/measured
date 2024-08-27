import React from 'react';
import { View, Text, StyleSheet } from 'react-native-web';

/**
 * @typedef {Object} AppProps
 * @property {string} [title] - The title to display in the app
 */

/**
 * Main App component
 * @param {AppProps} props - The component props
 * @returns {JSX.Element} The rendered App component
 */
function App({ title = 'Welcome to your Native Web App!' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

/** @type {Object.<string, import('react-native-web').StyleSheet>} */
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexGrow: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    width: '100%',
  },
});

export default App;