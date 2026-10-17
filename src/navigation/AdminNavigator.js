import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ServicosAdminScreen from '../screens/admin/ServicosAdminScreen';
import ServicoFormScreen from '../screens/admin/ServicoFormScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProfileScreen from '../screens/ProfileScreen';
import { makePlaceholder } from '../components/Placeholder';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ServicosNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: styles.header, headerTintColor: colors.card, contentStyle: styles.scene }}>
      <Stack.Screen name="ServicosLista" component={ServicosAdminScreen} options={{ title: 'Serviços' }} />
      <Stack.Screen name="ServiceForm" component={ServicoFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Editar serviço' : 'Novo serviço' })} />
    </Stack.Navigator>
  );
}

const telas = [
  { nome: 'Agenda', icone: 'calendar-outline', componente: makePlaceholder('Agenda') },
  { nome: 'Serviços', icone: 'sparkles-outline', componente: ServicosNavigator },
  { nome: 'Horários', icone: 'time-outline', componente: makePlaceholder('Horários') },
  { nome: 'Perfil', icone: 'person-outline', componente: ProfileScreen },
];

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerStyle: styles.header,
      headerTintColor: colors.card,
      sceneStyle: styles.scene,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarHideOnKeyboard: true,
    }}>
      {telas.map(tela => (
        <Tab.Screen key={tela.nome} name={tela.nome} component={tela.componente}
          options={{ headerShown: tela.nome !== 'Serviços', tabBarIcon: ({ color, size }) => <Ionicons name={tela.icone} color={color} size={size} /> }} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.dark },
  scene: { backgroundColor: colors.bg },
  tabBar: { backgroundColor: colors.card, borderTopColor: colors.border },
});
