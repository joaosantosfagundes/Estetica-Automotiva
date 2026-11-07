# Estética Automotiva

Aplicativo móvel para uma estética automotiva organizar seus serviços e horários. O cliente consulta o catálogo, cadastra seus veículos e acompanha a reserva pelo celular. A estética reúne os pedidos do dia em uma agenda e decide quais atendimentos confirmar.

## Perfis

| Perfil | Funcionalidades |
| --- | --- |
| Cliente | Cadastro e login, catálogo de serviços ativos, garagem com marca, modelo e ano da FIPE, foto opcional, agendamento por horário disponível, próximo atendimento na Home, histórico e cancelamento antes do início. |
| Administrador | Cadastro, edição e ativação de serviços, configuração dos dias e horários de funcionamento e gestão da agenda por dia. Pode confirmar, recusar, concluir e cancelar conforme o status da reserva. |

## Tecnologias e arquitetura

JavaScript, React Native 0.88, Expo SDK 58 e React Navigation 7. O Firebase Authentication identifica a conta e o Realtime Database armazena os dados. A API da FIPE, fornecida pela Parallelum, alimenta os seletores de veículos. AsyncStorage mantém a sessão e a preferência do último veículo. O Expo Image Picker permite escolher uma foto da galeria.

```text
Tela → Controller → Service → Repository → Firebase / API FIPE
                         └→ Entidades e utilitários
```

A tela apresenta dados e estados. O controller valida entradas, o service aplica as regras de negócio e o repository acessa a origem dos dados. O contexto de autenticação acompanha a sessão, e a navegação seleciona as abas pelo perfil.

```text
.
├── index.js e App.js             Entrada e composição do app
├── app.json e package.json       Configuração do Expo e dependências
├── assets/                       Ícones e imagens do app
├── database/
│   └── regras.json               Regras do Realtime Database
├── docs/
│   ├── modelo-de-dados.md         Coleções e regras de negócio
│   └── regras-de-seguranca.md     Publicação e testes de permissões
├── scripts/
│   └── testSchedule.mjs          Testes do cálculo de horários
└── src/
    ├── config/                   Inicialização do Firebase
    ├── contexts/                 Sessão autenticada
    ├── navigation/               Pilhas e abas por perfil
    ├── screens/
    │   ├── auth/                 Login e cadastro
    │   ├── cliente/              Home, serviços, garagem e agenda
    │   ├── admin/                Agenda, serviços e funcionamento
    │   └── ProfileScreen.js       Perfil compartilhado
    ├── controllers/              Entrada e validação
    ├── services/                 Regras de negócio
    ├── repositories/             Firebase e API FIPE
    ├── entities/                 Estruturas de domínio
    ├── components/               Controles da interface
    ├── theme/                    Cores e espaçamentos
    └── utils/                    Horários, formatação e preferências
```

## Rodar no celular

Use Git, npm e Node.js 22.13 ou posterior na linha 22, ou Node.js 24.3 ou posterior na linha 24. Instale o Expo Go compatível com SDK 58 no Android ou iOS. [Requisitos do Expo SDK 58](https://expo.dev/changelog/sdk-58) · [Expo Go](https://expo.dev/go)

1. Clone o repositório e instale as versões do arquivo de lock com `npm ci`. O comando `npm install` também instala as dependências do projeto.

   ```bash
   git clone https://github.com/joaosantosfagundes/Estetica-Automotiva.git
   cd Estetica-Automotiva
   npm ci
   ```

2. Em um clone novo, copie [`.env.example`](.env.example) para `.env` na raiz. No PowerShell, use `Copy-Item .env.example .env`. No Bash, use `cp .env.example .env`.
3. No Firebase Console, selecione o projeto da equipe ou prepare um projeto de teste. Em **Authentication → Método de login**, habilite **E-mail/senha**. Em **Realtime Database**, confira a instância e aplique as regras da seção abaixo. [Configuração do Firebase](https://firebase.google.com/docs/web/setup) · [Autenticação por e-mail e senha](https://firebase.google.com/docs/auth/web/password-auth)
4. Abra **Configurações do projeto → Geral → Seus apps** e selecione o app Web. Se a lista estiver vazia, cadastre um app Web para obter a configuração do SDK JavaScript. Preencha as sete variáveis do `.env` com os valores correspondentes.

   | Variável no `.env` | Campo do Firebase |
   | --- | --- |
   | `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
   | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `EXPO_PUBLIC_FIREBASE_DATABASE_URL` | `databaseURL`, a URL exata da instância exibida em Realtime Database |
   | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
   | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` |

   O Expo inclui variáveis `EXPO_PUBLIC_*` no bundle. Mantenha o `.env` local e reserve esse prefixo para a configuração pública do cliente Firebase. Guarde senhas e chaves de conta de serviço fora dele. [Variáveis de ambiente no Expo](https://docs.expo.dev/guides/environment-variables/)

5. Conecte o celular e o computador à mesma rede, rode o comando abaixo e abra o QR code com o Expo Go.

   ```bash
   npx expo start
   ```

Se editar o `.env`, reinicie o servidor com `npx expo start --clear`. O teste do cálculo de disponibilidade roda na raiz com `node scripts/testSchedule.mjs`.

## Regras de segurança e primeiro administrador

Em **Realtime Database → Regras**, confira a instância usada no `.env` e guarde uma cópia das regras atuais. Cole o conteúdo de [`database/regras.json`](database/regras.json) no editor. Confira a sintaxe e simule as permissões no **Laboratório de testes de regras** antes de clicar em **Publicar**. O guia detalha consultas, testes e limites da configuração. [Regras do projeto](docs/regras-de-seguranca.md) · [Referência do Firebase](https://firebase.google.com/docs/database/security/get-started)

1. Cadastre pelo app a conta que será administradora. O cadastro cria o perfil com `role: "cliente"`.
2. No Firebase Console, copie o UID em **Authentication → Usuários**. Em **Realtime Database → Dados**, localize `users/{UID}/role` e altere o valor para `admin` usando uma conta com acesso ao console.
3. Saia e entre de novo no app. As abas do administrador passam a aparecer quando a sessão lê o perfil atualizado.

Para conferir as permissões, simule com o UID de um cliente a escrita de `admin` em `users/{UID}/role`. O resultado esperado é **negado**. O papel no app vem desse campo, enquanto o acesso da equipe ao Firebase Console é gerenciado no projeto Firebase.

## Requisitos da disciplina

| Requisito | Onde conferir |
| --- | --- |
| React Navigation | [Navegação por perfil](src/navigation/index.js), [abas do cliente](src/navigation/ClientNavigator.js) e [abas do admin](src/navigation/AdminNavigator.js). |
| APIs externas | [Firebase Authentication](src/repositories/usuarioRepository.js), [Realtime Database](src/repositories/agendamentoRepository.js) e [consultas à FIPE](src/repositories/fipeRepository.js). |
| Formulários com validação | Controllers de [autenticação](src/controllers/authController.js), [veículo](src/controllers/veiculoController.js), [serviço](src/controllers/servicoController.js), [horário](src/controllers/configuracaoController.js) e [agendamento](src/controllers/agendamentoController.js). |
| Persistência | [Sessão Firebase com AsyncStorage](src/config/firebase.js) e [último veículo escolhido](src/utils/preferencias.js). |
| Recurso nativo | [Seleção de foto na galeria com Expo Image Picker](src/screens/cliente/VeiculoFormScreen.js). |
| Responsividade e acessibilidade | [Home](src/screens/cliente/HomeScreen.js), [garagem](src/screens/cliente/VehiclesScreen.js) e [botões compartilhados](src/components/Button.js). |
| Código em camadas | [Tela de agendar](src/screens/cliente/AgendarScreen.js) → [controller](src/controllers/agendamentoController.js) → [service](src/services/agendamentoService.js) → [repository](src/repositories/agendamentoRepository.js). |

## Conferência antes da entrega

- [ ] Verificar no console a publicação das regras e a negação da tentativa de elevação de perfil pelo cliente.
- [ ] Preparar uma conta admin e duas contas cliente com dados fictícios. Confirmar que João e Breno têm o acesso necessário ao projeto Firebase compartilhado.
- [ ] Abrir o app no Expo Go a partir de um clone limpo e de um `.env` preenchido localmente.
- [ ] Agendar como cliente, confirmar como admin, voltar à conta cliente e conferir **Confirmado**. Cancelar a reserva futura, conferir o **Histórico** e atualizar a agenda do admin para ver **Cancelado** e o horário liberado.
- [ ] Conferir que o vídeo usa dados de teste e que o `.env` está fora dos arquivos versionados.

### Roteiro de demonstração em até três minutos

| Tempo | Demonstração |
| --- | --- |
| 0:00–0:15 | Apresentar a dupla, o problema e os dois perfis. |
| 0:15–0:45 | Mostrar uma validação de cadastro, entrar e abrir o catálogo. |
| 0:45–1:15 | Cadastrar veículo com a FIPE e selecionar a foto. |
| 1:15–1:55 | Escolher serviço, veículo, data e horário e confirmar a reserva. |
| 1:55–2:30 | Abrir o dia como admin, confirmar a reserva e mostrar o formulário de serviço. |
| 2:30–2:45 | Voltar como cliente, conferir a confirmação e cancelar uma reserva futura. |
| 2:45–3:00 | Mostrar as camadas, o Firebase e a integração FIPE. |

Com a `main` integrada e a conferência concluída, marque o commit aprovado com `git tag v1.0` e publique a tag com `git push origin v1.0`.

## Limitações e próximos passos

- A disponibilidade é revalidada antes da gravação. A consulta e a escrita são operações separadas, então reservas concorrentes ainda podem ocupar o mesmo horário. Uma operação transacional no servidor pode garantir a exclusividade.
- A consulta por dia retorna os registros completos da data para calcular os horários livres. Uma coleção de disponibilidade sem identificadores pessoais, acessível a clientes autenticados, permitiria separar essa leitura da agenda individual.
- A foto usa a URI local retornada pelo seletor e pode ficar indisponível após limpeza do cache ou em outro aparelho. O histórico consulta o serviço e o veículo atuais. Pode refletir preços editados e mostrar um veículo como indisponível quando ele é removido.
- O cadastro de veículos depende da resposta da FIPE. A agenda e a Home atualizam ao receber foco, e a agenda oferece atualização manual.
- Notificações locais estão previstas como melhoria opcional após a entrega.

Veja os [campos e permissões do modelo](docs/modelo-de-dados.md).

## Equipe

João Vitor Fagundes e Breno Batista.
