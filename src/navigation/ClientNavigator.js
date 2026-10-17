import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProfileScreen from '../screens/ProfileScreen';
import { makePlaceholder } from '../components/Placeholder';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const telas = [
  { nome: 'Início', icone: 'home-outline', componente: makePlaceholder('Início') },
  { nome: 'Serviços', icone: 'sparkles-outline', componente: makePlaceholder('Serviços') },
  { nome: 'Veículos', icone: 'car-outline', componente: makePlaceholder('Veículos') },
  { nome: 'Agenda', icone: 'calendar-outline', componente: makePlaceholder('Agenda') },
  { nome: 'Perfil', icone: 'person-outline', componente: ProfileScreen },
];

export default function ClientNavigator() {
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
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name={tela.icone} color={color} size={size} /> }} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.dark },
  scene: { backgroundColor: colors.bg },
  tabBar: { backgroundColor: colors.card, borderTopColor: colors.border },
});
