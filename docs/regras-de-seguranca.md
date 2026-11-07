# Regras de segurança do Realtime Database

O arquivo a publicar é [database/regras.json](../database/regras.json). Esta tarefa não publica regras no Firebase; a publicação fica a cargo do responsável pelo console.

## Permissões

- Tudo começa negado. Admin é identificado por `root.child('users').child(auth.uid).child('role').val() === 'admin'`.
- **users/UID:** o próprio usuário ou admin lê o perfil individual. Somente o dono cria/atualiza seu perfil; na criação o role precisa ser cliente e, depois, é imutável. Nome, telefone, e-mail e role são obrigatórios. Os três primeiros são strings. O perfil e o role não podem ser apagados pelo app. Até o admin altera roles somente por acesso privilegiado ao console, não pelo SDK cliente.
- **services:** autenticados leem; somente admin grava. Nome é string, preço é número positivo, duração é número, ativo é boolean e categoria é string. Descrição, se presente, é string. Novos serviços exigem categoria; serviços legados sem categoria podem ser inativados e passam a ter categoria ao serem editados. Uma categoria existente não pode ser apagada. Exclusão definitiva do serviço é negada; use ativo = false.
- **settings:** autenticados leem e somente admin escreve. Estas regras controlam a permissão; não repetem as validações de horários do service.
- **vehicles:** clientes leem a coleção somente por consulta userId igual ao próprio UID; admin pode ler tudo. O dono cria, edita e exclui seu veículo, sem transferir userId nem tomar veículo de outro. A exceção de admin é apenas para leitura, conforme solicitado. Marca/modelo são strings; placa aceita padrão antigo ou Mercosul, com caixa indiferente e hífen opcional. Ano aceita inteiro de quatro dígitos ou string com quatro dígitos. fotoUri, se existir, é string.
- **bookings** permite que autenticados consultem um dia por data ou os próprios registros por userId. Admin lê tudo. A criação exige userId próprio e status pendente, inclusive para admin. O dono pode cancelar agendamentos pendentes ou confirmados escrevendo apenas no campo status. Admin pode atualizar registros existentes. Agendamentos com entrada financeira permanecem concluídos. O banco recusa exclusão de agendamentos. userId, vehicleId e serviceId são strings, data segue YYYY-MM-DD, as horas seguem HH:mm e criadoEm, quando informado, é um timestamp numérico. Campos extras são recusados.
- **receipts** registra o valor confirmado pelo admin, em centavos, junto com o nome do serviço e o horário de gravação fornecido pelo Firebase. Apenas admins leem as entradas. Cada `receipts/{id}` é criado uma vez, na mesma operação que conclui `bookings/{id}`. O total mensal usa `recebidoEm`. Atendimentos concluídos antes do Financeiro ficam no histórico da agenda, sem entrada retroativa.

**Importante para quem usar o SDK:** cancelar com update(ref(db, 'bookings/ID'), { status: 'cancelado' }) ou set(ref(db, 'bookings/ID/status'), 'cancelado'). Substituir o objeto inteiro com set(ref(db, 'bookings/ID'), objeto) é negado para o cliente, mesmo que repita os outros campos.

## Consultas e limites

As permissões solicitadas são expressáveis em regras do Realtime Database. Os índices estão em vehicles/userId e bookings/data e userId.

Regras não filtram o resultado de uma leitura sem consulta: obter vehicles ou bookings inteiro como cliente é negado. É obrigatório enviar orderByChild e equalTo. As consultas permitidas são:

```javascript
// db e auth pertencem à sessão autenticada do app ou do emulador.
get(query(ref(db, 'vehicles'), orderByChild('userId'), equalTo(auth.currentUser.uid)));
get(query(ref(db, 'bookings'), orderByChild('userId'), equalTo(auth.currentUser.uid)));
get(query(ref(db, 'bookings'), orderByChild('data'), equalTo('2026-11-02')));
```

A consulta por data permite ler os registros COMPLETOS daquele dia, inclusive de outros clientes, como solicitado. Regras não ocultam campos de um registro autorizado. Se for necessário mostrar só horários ocupados sem userId/vehicleId, a alternativa simples é uma coleção separada de disponibilidade sem dados pessoais, mantida por backend confiável; não basta negar campos filhos depois de autorizar a leitura do pai.

A validação de data verifica formato e faixas básicas de mês/dia, não calendário completo, conflitos, propriedade do vehicleId ou disponibilidade de serviço. Essas regras não substituem as regras de negócio do agendamento. O primeiro admin deve ser provisionado manualmente pelo responsável no console: primeiro cadastre a conta como cliente e depois altere users/UID/role para admin usando a aba Dados.

## Testes no Simulador de regras

Prefira um projeto de teste. Na aba Dados, prepare users/cli1 e users/cli2 com role cliente, e users/adm com role admin. Cada perfil deve ter nome, telefone e email como strings. No simulador, ative autenticação e informe exatamente o UID do cenário; não é suficiente escrever role nas claims simuladas, pois a regra consulta users/UID/role.

Crie fixtures pelo console em services/s1, vehicles/v1 (userId cli1), vehicles/v2 (userId cli2) e bookings/b1 (userId cli1). Use registros completos conforme exemplos abaixo. Mantenha os campos não citados e restaure a fixture entre cenários que a modificarem. Simulações não gravam as alterações.

| UID/operação | Caminho e dado | Esperado |
| --- | --- | --- |
| Sem autenticação: get | services | Negado |
| cli1: get | users/cli1 | Permitido |
| cli1: get | users/cli2 | Negado |
| adm: get | users/cli2 | Permitido |
| novo: set | users/novo com perfil completo e role cliente | Permitido |
| novo: set | users/novo com role admin | Negado |
| cli1: set | users/cli1/role = "admin" | Negado |
| cli1: set | users/cli1/role = null | Negado |
| cli1: set | users/cli1/telefone = 123 | Negado |
| adm: set | services/s2 com serviço válido | Permitido |
| cli1: set | services/s2 com o mesmo serviço | Negado |
| adm: set | services/s1/preco = 0 ou "40" | Negado |
| adm: set | services/s1/ativo = "false" | Negado |
| cli1: get/set | settings/horario | Leitura permitida; escrita negada |
| adm: set | settings/horario com a configuração | Permitido |
| cli1: get | vehicles sem consulta | Negado |
| adm: get | vehicles sem consulta | Permitido |
| cli1: set | vehicles/v3 com userId cli1 | Permitido |
| cli1: set | vehicles/v3 com userId cli2 | Negado |
| cli1: set | vehicles/v1/userId = "cli2" | Negado |
| cli1: set | vehicles/v2/userId = "cli1" | Negado |
| cli1: set | vehicles/v1/placa = "invalida" | Negado |
| cli1: set | bookings/b3 próprio com status pendente | Permitido |
| cli1: set | bookings/b3 com userId cli2 ou status confirmado | Negado |
| cli1: set | bookings/b1/status = "cancelado" | Permitido |
| cli1: set | bookings/b1/status = "confirmado" | Negado |
| cli1: set | bookings/b1/horaInicio = "11:00" | Negado |
| cli2: set | bookings/b1/status = "cancelado" | Negado |
| adm: set | bookings/b1/status: testar os quatro status válidos | Permitido |
| adm: set | bookings/b1/status = "outro" | Negado |
| cli1: set | booking novo com data "02/11/2026" ou horaFim "24:00" | Negado |
| adm: set | caminho fora das coleções listadas | Negado |

Exemplos completos para as escritas:

```json
{
  "perfil": {"nome":"Cliente","telefone":"11999999999","email":"cliente@exemplo.com","role":"cliente"},
  "servico": {"nome":"Lavagem","descricao":"Externa","preco":40,"duracaoMin":60,"ativo":true,"categoria":"Exterior"},
  "veiculo": {"userId":"cli1","marca":"Fiat","modelo":"Uno","placa":"ABC1234","ano":2020},
  "agendamento": {"userId":"cli1","vehicleId":"v1","serviceId":"s1","data":"2026-11-02","horaInicio":"09:00","horaFim":"10:00","status":"pendente","criadoEm":1793577600000},
  "horario": {"abertura":"08:00","fechamento":"18:00","diasFuncionamento":[1,2,3,4,5,6]}
}
```

Use somente o objeto correspondente como payload no caminho indicado, sem os wrappers perfil/servico/etc. Para consultas, se o painel não oferecer orderByChild/equalTo, use o SDK com o emulador local; um get simples no simulador não equivale a uma consulta. Confira: veículos com userId cli1 permitidos, userId cli2 negados para cli1; bookings por data e por userId próprio permitidos, por userId alheio e sem equalTo negados.

Na etapa A5, foram executados 76 cenários no emulador oficial do Realtime Database v4.11.2, incluindo compilação das regras, consultas com autenticação simulada, tipos, alteração conjunta de status e outros campos, exclusão de campos e tentativa de elevar role e gravar serviço na mesma operação.

Para conferir o Financeiro, confirme um agendamento como admin e use **Concluir e registrar** com um valor em reais. Abra a aba **Financeiro** e confira o total e a entrada no mês. Como cliente, simule a leitura de `receipts` e confirme que ela é negada. A conclusão com entrada usa uma atualização com dois caminhos, que pode ser simulada no emulador com o SDK.

## Publicar manualmente pelo console

1. Abra o Firebase Console, selecione o projeto correto e vá a **Build → Realtime Database** (não Cloud Firestore).
2. Confira a instância/URL do banco e copie as regras atuais para guardar um backup. Confira os dados legados e provisione o primeiro admin como explicado acima.
3. Abra **Regras**, substitua TODO o conteúdo pelo conteúdo de database/regras.json, incluindo o objeto externo rules. Não cole Markdown ou exemplos da documentação.
4. Antes de publicar, confira os erros de sintaxe no editor e execute os cenários no **Simulador de regras / Rules Playground**, usando os dados e UIDs corretos.
5. Somente quando os resultados estiverem corretos, clique em **Publicar** e confirme a nova versão. Esta ação será feita por você no console, não pelo Codex.
6. No app, teste cadastro/login, leitura de serviços e horário, cadastro de serviço como admin e bloqueio da mesma gravação como cliente. As futuras consultas de veículos/agendamentos devem usar os filtros acima.

Publique as regras com `receipts` antes de usar a versão do app com a aba **Financeiro**, pois a conclusão do atendimento passa a gravar essa entrada na mesma operação.

Referências: [condições e consultas](https://firebase.google.com/docs/database/security/rules-conditions), [sintaxe e cascata](https://firebase.google.com/docs/database/security/core-syntax), [API das regras](https://firebase.google.com/docs/reference/security/database).
