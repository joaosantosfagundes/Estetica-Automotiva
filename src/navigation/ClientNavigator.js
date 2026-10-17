import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import AgendaScreen from '../screens/AgendaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const telas = [
  { nome: 'Início', icone: 'home-outline', ativo: 'home', componente: HomeScreen },
  { nome: 'Serviços', icone: 'sparkles-outline', ativo: 'sparkles', componente: ServicesScreen },
  { nome: 'Veículos', icone: 'car-outline', ativo: 'car', componente: VehiclesScreen },
  { nome: 'Agenda', icone: 'calendar-outline', ativo: 'calendar', componente: AgendaScreen },
  { nome: 'Perfil', icone: 'person-outline', ativo: 'person', componente: ProfileScreen },
];

export default function ClientNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      sceneStyle: styles.scene,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: styles.tabLabel,
      tabBarHideOnKeyboard: true,
    }}>
      {telas.map(tela => (
        <Tab.Screen key={tela.nome} name={tela.nome} component={tela.componente}
          options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? tela.ativo : tela.icone} color={color} size={size} /> }} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.bg },
  tabBar: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, elevation: 0 },
  tabLabel: { fontSize: 10, fontWeight: '700' },
});
