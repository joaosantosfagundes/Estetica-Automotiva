# Modelo de dados

O projeto usa uma instância do Realtime Database. O Firebase Authentication mantém as contas e identifica cada sessão pelo UID. O perfil fica em `users/{uid}`. As senhas são gerenciadas pelo Authentication.

Os IDs de serviços, veículos e agendamentos são as chaves criadas por `push()`. As entidades expõem essas chaves como `id`, e `Usuario` expõe o UID como `uid`. O app usa a chave do nó para preencher esses atributos ao ler o banco. [Entidades](../src/entities) · [Repositórios](../src/repositories)

## Coleções e campos

| Caminho | Campos persistidos |
| --- | --- |
| `users/{uid}` | `nome`, `telefone` e `email` são textos. `role` vale `cliente` ou `admin`. Os quatro campos são obrigatórios. O app inicia o cadastro como cliente e guarda o telefone em dígitos. |
| `vehicles/{id}` | `userId` referencia o UID do proprietário. `marca`, `modelo` e `placa` são textos. `ano` é gravado como inteiro. `fotoUri` é opcional nas regras e o app grava uma string vazia quando não há foto. |
| `services/{id}` | `nome` é texto, `preco` é um número positivo em reais, `duracaoMin` é um número em minutos e `ativo` é booleano. `categoria` é uma string obrigatória em registros novos. `descricao` é texto opcional nas regras. |
| `bookings/{id}` | `userId`, `vehicleId` e `serviceId` referenciam o cliente, o veículo e o serviço. `data` usa `YYYY-MM-DD` e `horaInicio`/`horaFim` usam `HH:mm`. `status` vale `pendente`, `confirmado`, `cancelado` ou `concluido`. `criadoEm` é o timestamp numérico em milissegundos que o app gera com `Date.now()`. As regras aceitam registros legados sem esse campo. |
| `settings/horario` | `abertura` e `fechamento` usam `HH:mm`. `diasFuncionamento` é uma lista de números de 0 (domingo) a 6 (sábado). O padrão é 08:00–18:00 de segunda a sábado. |

### Validações e compatibilidade

- **Serviços.** O app aceita `Exterior`, `Pintura`, `Interior`, `Proteção` e `Outros`, e exige duração inteira de 15 a 600 minutos. Serviço legado com categoria ausente ou desconhecida aparece em `Outros`. O administrador pode inativar serviços preservando suas referências.
- **Veículos.** A marca, o modelo e o ano vêm da FIPE. O app normaliza a placa para maiúsculas sem hífen, aceita os formatos antigo e Mercosul e verifica a duplicidade na garagem do cliente. A leitura aceita ano legado armazenado como string de quatro dígitos. `fotoUri` guarda apenas a referência local, e o arquivo de imagem fica no aparelho.
- **Funcionamento.** O service exige pelo menos um dia, sem repetir dias. O fechamento deve suceder a abertura por pelo menos uma hora. As regras do banco autorizam a edição pelo administrador, e o service valida o conteúdo.
- **Preferências locais.** O SDK de autenticação usa AsyncStorage para persistir a sessão. O último veículo bem-sucedido fica na chave `@estetica/ultimo-veiculo` e só é pré-selecionado quando ainda consta na garagem da sessão atual. [Preferências](../src/utils/preferencias.js)

## Reservas e disponibilidade

O cálculo usa o dia e as horas locais. Cada reserva ocupa `[horaInicio, horaFim)`, com `horaFim = horaInicio + duracaoMin`. Os horários começam em passos de 30 minutos dentro do funcionamento. Reservas `pendente` e `confirmado` bloqueiam sobreposições. Uma reserva adjacente pode começar no instante em que a anterior termina. O app verifica a disponibilidade novamente antes de gravar.

| Situação | Operação no app |
| --- | --- |
| Nova reserva | O cliente cria um registro próprio com status `pendente`. |
| Pendente | O admin pode confirmar ou recusar. Recusar grava `cancelado`. |
| Confirmada | O admin pode concluir ou cancelar. |
| Reserva futura do cliente | O proprietário pode cancelar quando o status é `pendente` ou `confirmado`. A gravação altera apenas `bookings/{id}/status`. |
| Cancelada ou concluída | A reserva permanece no histórico e deixa de ocupar horário. |

A interface apresenta data, cliente, veículo e serviço a partir das referências. O preço exibido vem do cadastro atual do serviço. Ao remover um veículo, a reserva continua registrada e as telas tratam a referência ausente. [Cálculo de horários](../src/utils/schedule.js) · [Serviço de agendamento](../src/services/agendamentoService.js) · [Serviço da agenda admin](../src/services/agendaService.js)

## Permissões e índices

| Caminho | Comportamento das regras |
| --- | --- |
| `users/{uid}` | O próprio usuário e o admin leem o perfil individual. O usuário cria o perfil como cliente e pode atualizar seus dados preservando o papel. A promoção a admin é feita no console. |
| `vehicles` | O cliente consulta com `query(ref(db, 'vehicles'), orderByChild('userId'), equalTo(uid))`. O admin lê a coleção. A gravação pertence ao proprietário. O índice é `userId`. |
| `services` e `settings` | Contas autenticadas leem. O admin escreve. Serviços podem ser desativados, e a exclusão pelo app é bloqueada. |
| `bookings` | O cliente consulta pelo próprio `userId` ou por uma data exata. O admin lê a coleção. A criação exige UID próprio e status pendente. O proprietário pode escrever `cancelado` no campo de status, e o admin pode atualizar a reserva existente com um status válido. Os índices são `data` e `userId`. |

A leitura por data inclui os dados completos das reservas daquele dia. As restrições de horário, propriedade do veículo usado na reserva e transições operacionais são aplicadas pelo app. O banco controla o acesso e valida tipos e formatos. Consultar disponibilidade e gravar são operações separadas e podem concorrer. [Regras e testes](regras-de-seguranca.md) · [Arquivo de regras](../database/regras.json)

## Exemplo de formato

Os dados abaixo são fictícios. No app, `uid-cliente` corresponde ao UID criado no Authentication e as demais chaves são geradas pelo Realtime Database.

```json
{
  "users": {
    "uid-cliente": {
      "nome": "Ana Exemplo",
      "telefone": "11999999999",
      "email": "ana@example.com",
      "role": "cliente"
    }
  },
  "vehicles": {
    "veiculo-exemplo": {
      "userId": "uid-cliente",
      "marca": "Fiat",
      "modelo": "Uno",
      "ano": 2020,
      "placa": "ABC1D23",
      "fotoUri": ""
    }
  },
  "services": {
    "servico-exemplo": {
      "nome": "Lavagem simples",
      "descricao": "Limpeza externa",
      "categoria": "Exterior",
      "preco": 50,
      "duracaoMin": 60,
      "ativo": true
    }
  },
  "bookings": {
    "reserva-exemplo": {
      "userId": "uid-cliente",
      "vehicleId": "veiculo-exemplo",
      "serviceId": "servico-exemplo",
      "data": "2026-11-09",
      "horaInicio": "09:00",
      "horaFim": "10:00",
      "status": "pendente",
      "criadoEm": 1794049200000
    }
  },
  "settings": {
    "horario": {
      "abertura": "08:00",
      "fechamento": "18:00",
      "diasFuncionamento": [1, 2, 3, 4, 5, 6]
    }
  }
}
```
