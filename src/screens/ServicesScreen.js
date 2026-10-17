import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii, spacing } from '../theme';

const servicos = [
  { nome: 'Lavagem premium', categoria: 'Exterior', descricao: 'Lavagem técnica, secagem cuidadosa e acabamento nos pneus.', preco: 'R$ 89', duracao: '1h', icone: 'water-outline' },
  { nome: 'Polimento técnico', categoria: 'Pintura', descricao: 'Mais profundidade e brilho para a pintura do seu veículo.', preco: 'R$ 249', duracao: '3h', icone: 'sparkles-outline' },
  { nome: 'Higienização interna', categoria: 'Interior', descricao: 'Limpeza profunda de bancos, carpetes, teto e painel.', preco: 'R$ 169', duracao: '2h', icone: 'leaf-outline' },
  { nome: 'Vitrificação', categoria: 'Proteção', descricao: 'Proteção cerâmica para conservar o brilho por mais tempo.', preco: 'R$ 499', duracao: '5h', icone: 'shield-checkmark-outline' },
];
const filtros = ['Todos', 'Exterior', 'Pintura', 'Interior', 'Proteção'];

export default function ServicesScreen({ navigation }) {
  const [filtro, setFiltro] = useState('Todos');
  const lista = filtro === 'Todos' ? servicos : servicos.filter(item => item.categoria === filtro);
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>CATÁLOGO DE CUIDADOS</Text>
        <Text style={styles.title}>Escolha o seu{`\n`}próximo cuidado.</Text>
        <Text style={styles.subtitle}>Serviços pensados para manter seu carro sempre no melhor estado.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filtros.map(item => <Pressable key={item} onPress={() => setFiltro(item)} style={[styles.filter, filtro === item && styles.filterActive]}><Text style={[styles.filterText, filtro === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.list}>{lista.map(servico => <View key={servico.nome} style={styles.card}>
          <View style={styles.icon}><Ionicons name={servico.icone} size={23} color={colors.primary} /></View>
          <View style={styles.cardBody}><View style={styles.cardTop}><Text style={styles.name}>{servico.nome}</Text><Text style={styles.price}>{servico.preco}</Text></View><Text style={styles.description}>{servico.descricao}</Text><View style={styles.meta}><Text style={styles.duration}><Ionicons name="time-outline" size={14} color={colors.muted} /> {servico.duracao}</Text><Pressable onPress={() => navigation.navigate('Agenda')} style={styles.book}><Text style={styles.bookText}>Agendar</Text><Ionicons name="arrow-forward" size={14} color={colors.dark} /></Pressable></View></View>
        </View>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.lg, gap: spacing.md }, eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 30, lineHeight: 33, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, maxWidth: 340 }, filters: { gap: 8, paddingVertical: 8 }, filter: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 15, backgroundColor: colors.card }, filterActive: { backgroundColor: colors.dark, borderColor: colors.dark }, filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, filterTextActive: { color: colors.white }, list: { gap: 12 }, card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', gap: 13 }, icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }, cardBody: { flex: 1, gap: 7 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, name: { color: colors.text, fontSize: 15, fontWeight: '800', flex: 1 }, price: { color: colors.primary, fontSize: 15, fontWeight: '800' }, description: { color: colors.muted, fontSize: 12, lineHeight: 17 }, meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }, duration: { color: colors.muted, fontSize: 12 }, book: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 }, bookText: { color: colors.dark, fontSize: 12, fontWeight: '800' } });
