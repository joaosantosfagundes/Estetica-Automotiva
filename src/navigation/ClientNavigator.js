import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VeiculoFormScreen from '../screens/cliente/VeiculoFormScreen';
import ServiceDetailScreen from '../screens/cliente/ServiceDetailScreen';
import AgendarScreen from '../screens/cliente/AgendarScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import HomeScreen from '../screens/cliente/HomeScreen';
import ServicesScreen from '../screens/cliente/ServicesScreen';
import VehiclesScreen from '../screens/cliente/VehiclesScreen';
import AgendaScreen from '../screens/cliente/AgendaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const telas = [
  { nome: 'Início', icone: 'home-outline', ativo: 'home', componente: HomeScreen },
  { nome: 'Serviços', icone: 'sparkles-outline', ativo: 'sparkles', componente: ServicesScreen },
  { nome: 'Veículos', icone: 'car-outline', ativo: 'car', componente: VehiclesScreen },
  { nome: 'Agenda', icone: 'calendar-outline', ativo: 'calendar', componente: AgendaScreen },
  { nome: 'Perfil', icone: 'person-outline', ativo: 'person', componente: ProfileScreen },
];

function ClientTabs() {
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

export default function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: styles.header, headerTintColor: colors.text, contentStyle: styles.scene }}>
      <Stack.Screen name="ClientTabs" component={ClientTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Detalhes do serviço' }} />
      <Stack.Screen name="AddVehicle" component={VeiculoFormScreen} options={{ title: 'Adicionar veículo' }} />
      <Stack.Screen name="Book" component={AgendarScreen} options={{ title: 'Agendar' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.bg },
  scene: { backgroundColor: colors.bg },
  tabBar: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, elevation: 0 },
  tabLabel: { fontSize: 10, fontWeight: '700' },
});
