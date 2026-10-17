# AGENTS.md — Estética Automotiva

App mobile (React Native + Expo) para UMA única estética automotiva, feito por uma dupla de estudantes (projeto acadêmico).
Perfis: "cliente" (vê serviços e preços, cadastra veículos, agenda e acompanha) e "admin" (gerencia serviços, horário de funcionamento e agenda).
Priorize padrões mobile-first, desempenho e compatibilidade entre Android e iOS.

## Expo muda a cada versão — não confie na sua memória

O Expo traz mudanças que quebram APIs a cada SDK. APIs que você conhece podem ter sido renomeadas, movidas ou removidas. Antes de escrever código que use Expo ou React Native:

1. Leia a versão major do pacote `expo` no `package.json`.
2. Se tiver acesso à internet, consulte a doc dessa versão: https://docs.expo.dev/versions/v<major>.0.0/
3. Para qualquer outra coisa, consulte https://docs.expo.dev/llms.txt (índice da doc com correções de erros comuns de LLMs). Nunca responda de memória.

## Comandos

```bash
npx expo install <pacote>   # SEMPRE use isto em vez de npm install para pacotes do Expo/RN (resolve versões compatíveis com o SDK)
npx expo start              # inicia o servidor de desenvolvimento
npx expo-doctor             # diagnostica problemas de dependências e configuração
npx expo install --fix      # corrige versões incompatíveis
npx expo lint               # lint (somente se o ESLint estiver configurado)
```

Antes de dar uma tarefa como pronta, confira que o app abre sem erro e rode o lint se existir. Pacotes que não são do Expo (ex.: firebase) podem ser instalados com `npm install`, mas avise antes de adicionar qualquer biblioteca nova.

## Navegação

- Usar **React Navigation** (native-stack + bottom-tabs). NÃO usar Expo Router (exigência da disciplina).
- Ponto de entrada: `index.js` (registerRootComponent) -> `App.js`.

## Regras do Expo

- Se as pastas `ios/` e `android/` não existem, elas são geradas automaticamente. Nunca criar nem editar à mão; configurar comportamento nativo em `app.json` e config plugins.
- O Expo Go só inclui os módulos nativos que já vêm nele. Se uma biblioteca com código nativo exigir development build, avise antes de instalar.
- Prefira módulos oficiais do Expo a bibliotecas de terceiros.

## Stack do projeto

- JavaScript (sem TypeScript)
- Firebase Authentication (e-mail/senha) e Realtime Database
- AsyncStorage, expo-image-picker, expo-notifications
- API FIPE (parallelum.com.br/fipe) para marca, modelo e ano

## Arquitetura em camadas (mesmo padrão do SGM-Marmitaria e do Sistema-Gestao-Consorcios)

Fluxo obrigatório: Screen -> Controller -> Service -> Repository -> Firebase/API.
- Entity (src/entities): formato do dado, constantes (ex.: STATUS_AGENDAMENTO) e função que monta o objeto a partir do Firebase. Sem acesso a dados.
- Repository (src/repositories): ÚNICO lugar que importa firebase ou chama API externa (FIPE). Só leitura e escrita, sem regra de negócio.
- Service (src/services): regras de negócio (horários disponíveis, conflito de agenda, transição de status). Usa repositories e entities. Lança AppError com mensagem em português quando uma regra falha.
- Controller (src/controllers): ponto de entrada das telas. Valida os dados do formulário, chama os services e devolve o resultado. Erros sobem como AppError para a tela exibir.
- Screen/Component (src/screens, src/components): só interface e estado local. NUNCA importa repository nem firebase; chama apenas controllers.
- Guarda de perfil: src/navigation decide Auth, Cliente ou Admin pelo role do usuário.
- Funções puras de cálculo (ex.: horários livres) ficam em src/utils e são usadas pelos services.

## Estrutura de pastas

src/config        -> firebase.js
src/contexts      -> AuthContext
src/entities      -> Usuario, Veiculo, Servico, Agendamento, Configuracao
src/repositories  -> usuarioRepository, veiculoRepository, servicoRepository, agendamentoRepository, configuracaoRepository, fipeRepository
src/services      -> authService, veiculoService, servicoService, agendamentoService, agendaService, configuracaoService
src/controllers   -> authController, veiculoController, servicoController, agendamentoController, agendaController, configuracaoController
src/navigation    -> AuthStack, ClientNavigator, AdminNavigator, index
src/screens/auth, src/screens/cliente, src/screens/admin
src/components    -> Button, Input, Card, Loading
src/utils         -> schedule.js, validators.js, formatters.js, AppError.js
src/theme         -> cores e espaçamentos
database/         -> regras.json (regras do Realtime Database) e seed.json (dados de exemplo)
scripts/          -> utilitários de desenvolvimento
docs/             -> modelo-de-dados.md e decisões

## Modelo de dados (Realtime Database)

users/{uid}: nome, telefone, email, role ("cliente" | "admin")
vehicles/{id}: userId, marca, modelo, ano, placa, fotoUri
services/{id}: nome, descricao, preco (number, reais), duracaoMin (number), ativo (boolean)
bookings/{id}: userId, vehicleId, serviceId, data ("YYYY-MM-DD"), horaInicio ("HH:mm"), horaFim ("HH:mm"), status ("pendente" | "confirmado" | "cancelado" | "concluido"), criadoEm
settings/horario: abertura ("HH:mm"), fechamento ("HH:mm"), diasFuncionamento (array de 0 a 6)

## Regra de negócio central

Um agendamento ocupa o intervalo [horaInicio, horaFim), onde horaFim = horaInicio + duracaoMin do serviço.
Só se oferecem horários dentro do funcionamento e sem sobrepor agendamentos "pendente" ou "confirmado".
Antes de gravar, revalidar a disponibilidade. Agendamentos cancelados liberam o horário.

## Convenções de código

- Componentes funcionais com hooks; estilos com StyleSheet.create
- Cores somente de src/theme; layout responsivo (useWindowDimensions, SafeAreaView)
- Textos da interface em português; nomes de domínio em português (servico, agendamento, veiculo)
- Nomes: componentes em PascalCase, funções e variáveis em camelCase
- Validar todo formulário antes de enviar; tratar loading e erro em toda chamada assíncrona
- Toda tela trata três estados: carregando, erro (mensagem do AppError) e vazio
- Cada funcionalidade nova passa pelas camadas na ordem: entity -> repository -> service -> controller -> screen
- Chaves do Firebase apenas em variáveis EXPO_PUBLIC_* no .env (nunca commitar)
- Arquivos compartilhados (navigation, contexts, theme, components, utils/validators, AppError): alterar o mínimo necessário e avisar o outro antes

## Como responder

- Mostrar o código COMPLETO dos arquivos criados ou alterados, não só trechos
- Explicar de forma direta o que foi feito e por quê, sem enrolação
- Alterar apenas os arquivos pedidos na tarefa; listar ao final o que mudou
- Dizer como testar o resultado (o que clicar e o que deve aparecer)