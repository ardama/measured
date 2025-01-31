import Header from '@c/Header';
import { Icons } from '@u/constants/Icons';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Text } from 'react-native-paper';


const Plus = () => {
  const listItems = [
    {
      title: 'Combo measurements',
      description: 'Combine multiple measurements into a single measurement',
      icon: Icons.measurement
    }
  ]
  return (
    <>
      <Header title='Measured Plus' showBackButton />
      <ScrollView>
        <View>
          <Text variant='headlineSmall'>Add to your Measured experience</Text>
        </View>


        <Button>
          <Text>Upgrade</Text>
        </Button>
      </ScrollView>
    </>
  );
}

export default Plus;