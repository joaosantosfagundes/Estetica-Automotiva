import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, spacing } from '../theme';

const servicos = [
  { id: '1', nome: 'Lavagem premium', descricao: 'Brilho impecável por dentro e por fora', preco: 'R$ 89', icone: 'water-outline' },
  { id: '2', nome: 'Polimento técnico', descricao: 'Recupere a profundidade da pintura', preco: 'R$ 249', icone: 'sparkles-outline' },
  { id: '3', nome: 'Higienização interna', descricao: 'Cuidado profundo para cada detalhe', preco: 'R$ 169', icone: 'leaf-outline' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const primeiroNome = user?.nome?.split(' ')[0] || 'cliente';
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.eyebrow}>ESTÉTICA AUTOMOTIVA</Text>
            <Text style={styles.greeting}>Olá, {primeiroNome}</Text>
          </View>
          <Pressable style={styles.bell} accessibilityLabel="Notificações">
            <Ionicons name="notifications-outline" size={21} color={colors.text} />
            <View style={styles.dot} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>SEU CARRO, DO SEU JEITO</Text>
            <Text style={styles.heroTitle}>Cuidado que{`\n`}você percebe.</Text>
            <Text style={styles.heroText}>Agende seu próximo momento de brilho em poucos toques.</Text>
            <Pressable style={styles.heroButton} onPress={() => navigation.navigate('Serviços')}>
              <Text style={styles.heroButtonText}>Ver serviços</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.dark} />
            </Pressable>
          </View>
          <View style={styles.heroShape}>
            <Ionicons name="car-sport-outline" size={72} color={colors.primary} />
            <Text style={styles.heroShapeText}>BRILHO{`\n`}AUTÊNTICO</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximo cuidado</Text>
          <Pressable onPress={() => navigation.navigate('Agenda')}><Text style={styles.link}>Ver agenda</Text></Pressable>
        </View>
        <Pressable style={styles.bookingCard} onPress={() => navigation.navigate('Agenda')}>
          <View style={styles.dateBadge}><Text style={styles.dateDay}>18</Text><Text style={styles.dateMonth}>OUT</Text></View>
          <View style={styles.bookingInfo}><Text style={styles.bookingTitle}>Polimento técnico</Text><Text style={styles.bookingMeta}>Sexta-feira · 14:30 · Honda Civic</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Escolha seu cuidado</Text>
          <Pressable onPress={() => navigation.navigate('Serviços')}><Text style={styles.link}>Ver todos</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceRow}>
          {servicos.map(servico => (
            <Pressable key={servico.id} style={styles.serviceCard} onPress={() => navigation.navigate('Serviços')}>
              <View style={styles.serviceIcon}><Ionicons name={servico.icone} size={22} color={colors.primary} /></View>
              <Text style={styles.serviceName}>{servico.nome}</Text>
              <Text style={styles.serviceDescription}>{servico.descricao}</Text>
              <Text style={styles.servicePrice}>{servico.preco}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.tipCard}><Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} /><View style={styles.tipCopy}><Text style={styles.tipTitle}>Seu carro em boas mãos</Text><Text style={styles.tipText}>Produtos profissionais e atenção em cada detalhe.</Text></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  greeting: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, position: 'absolute', right: 10, top: 9 },
  hero: { minHeight: 232, backgroundColor: colors.dark, borderRadius: radii.lg, padding: spacing.lg, flexDirection: 'row', overflow: 'hidden' },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: colors.white, fontSize: 28, lineHeight: 31, fontWeight: '800', marginTop: 10 },
  heroText: { color: '#B9B4AB', fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 210 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 16, marginTop: 18 },
  heroButtonText: { color: colors.dark, fontWeight: '800', fontSize: 13 },
  heroShape: { position: 'absolute', right: -24, bottom: -18, width: 170, height: 170, borderRadius: 90, borderWidth: 1, borderColor: '#6D5637', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }] },
  heroShapeText: { color: '#8B765A', fontSize: 10, lineHeight: 13, letterSpacing: 1.7, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  link: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  bookingCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateBadge: { width: 48, height: 54, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.dark, fontSize: 20, fontWeight: '800' },
  dateMonth: { color: colors.primary, fontSize: 10, fontWeight: '800', marginTop: 1 },
  bookingInfo: { flex: 1, gap: 4 },
  bookingTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  bookingMeta: { color: colors.muted, fontSize: 12 },
  serviceRow: { gap: 12, paddingRight: spacing.lg },
  serviceCard: { width: 174, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, gap: 8 },
  serviceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  serviceName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  serviceDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, minHeight: 34 },
  servicePrice: { color: colors.primary, fontSize: 15, fontWeight: '800', marginTop: 3 },
  tipCard: { backgroundColor: '#FBF3E6', borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', gap: 12, alignItems: 'center' },
  tipCopy: { flex: 1, gap: 3 },
  tipTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  tipText: { color: colors.muted, fontSize: 12 },
});
