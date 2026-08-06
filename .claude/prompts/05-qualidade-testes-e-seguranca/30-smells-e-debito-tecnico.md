# Prompt 30 — Deteccao de Smells e Debito Tecnico

**Categoria:** Qualidade, Testes e Seguranca
**Objetivo:** Mapear code smells e debito tecnico concretos no projeto, com caminho:linha e proposta de refactor, gerando um backlog acionavel em vez de uma lista subjetiva.
**Quando usar:** Em projetos maduros, periodicamente, ou antes de planejar um quarter de "saude tecnica". Tambem util para novos desenvolvedores entenderem onde mora a dor.

---

## PROMPT

```
Quero uma varredura de code smells deste projeto. Quero achados concretos, nao listas academicas.

## Smells a procurar

### 1. Long method

Funcoes/metodos com > 50 linhas reais de codigo (nao conta comentarios e linhas em branco). Liste os 10 piores.

### 2. Long parameter list

Funcoes com > 5 parametros. Liste os 10 piores. Propostas: objeto de argumentos, builder, separar responsabilidades.

### 3. God class

Classes com:
- > 20 metodos publicos
- > 10 campos
- > 500 linhas

Liste candidatas. Para cada, proponha como dividiria (duas responsabilidades separaveis?).

### 4. Feature envy

Metodo em classe A que chama muitos metodos de classe B — provavelmente deveria estar em B. Procure por padroes onde um metodo acessa 3+ getters/metodos do mesmo outro objeto.

### 5. Data clumps

Grupos de 3+ parametros que aparecem juntos em multiplas funcoes. Candidato a virar um objeto/struct. Procure padroes tipo `(userId, orgId, tenantId)` repetidos.

### 6. Primitive obsession

Uso pesado de string/number onde existiria um tipo de dominio. Ex: `amount: number` no lugar de `Money`. Procure campos que podem ser domain types.

### 7. Shotgun surgery

Mudancas pequenas exigindo alteracoes em 5+ arquivos. Use git log para encontrar commits recentes que tocaram muitos arquivos para fazer uma unica coisa.

### 8. Duplicated code

Blocos de 10+ linhas quase identicos em 2+ lugares. Use similarity scanning rapido (greps heuristicos se nao houver ferramenta). Priorize duplicacao em logica de negocio (nao teste ou fixture).

### 9. Comments como muleta

Comentarios explicando codigo complicado ("este if e porque X") — o comentario e pista de que o codigo deveria ser reescrito mais claro.

### 10. Dead code

Remetido ao Prompt 23. Se ja fez, use os achados.

### 11. Flags booleanos em parametro

Funcoes com `doSomething(user, true)` — o `true` nao diz nada ao leitor. Proposta: dividir em duas funcoes.

### 12. Deep nesting

`if` dentro de `if` dentro de `if` > 4 niveis. Sinal de logica complicada sem decomposicao.

### 13. Magic numbers

Numeros literais espalhados (`if (age > 18)`, `retry(3)`, `timeout(5000)`). Sugerir constantes nomeadas.

### 14. Switch/if gigante em type

Switch de 10+ casos sobre um campo "type". Tipicamente e sinal de polimorfismo faltando.

### 15. Global mutable state

Variaveis globais sendo modificadas de varios lugares. Dificulta teste e paraleliza mal.

### 16. Excecoes como fluxo

`try/catch` usado para controle de fluxo "normal" (ex: tentar ler, se nao existir, catch cria). Melhor: check explicito.

## Output

Entregue `docs/claude/SMELLS.md` com:

1. **Sumario** — contagem por tipo
2. **Top 10 priorizados por impacto** (criticos para refactor)
3. **Detalhes por achado**:
   - Tipo de smell
   - Arquivo:linha
   - Trecho (5-15 linhas)
   - Por que e problema (1-2 linhas)
   - Refactor sugerido (nome tecnico, ex: "Extract Method", "Replace Conditional with Polymorphism")
   - Esforco (baixo/medio/alto)
   - Risco (baixo/medio/alto)

## Regras

- Nao invente smells. Se um metodo tem 30 linhas, nao e long method.
- Nao proponha refactor sem citar trecho concreto.
- Nao priorize por "quantos smells tem" — priorize por IMPACTO (smell em caminho critico pior que em utilitario).
- Evite sugerir refactor grande se o codigo e estavel e sem evolucao. Se nao da manutencao, smell ali e barato.

Comece pela lista dos 10 long methods.
```

---

## Variacoes e Ajustes

**Projeto com ferramentas de analise (SonarQube, Code Climate, CodeScene):** compare os achados do Claude com os da ferramenta. Complementares — ferramenta pega quantidade, Claude pega contexto.

**Codigo idiomatico de linguagem nao-OO (Go, Rust):** ignore smells OO (god class, polimorfismo) e reforce outros (long function, deep nesting, goroutines abandonadas para Go).

**Projeto em early stage:** esperado ter alguns smells. Priorize apenas os que bloqueiam evolucao.

---

## Dicas de uso

- Trate o output como backlog, nao como lista de vergonha. Priorize, agende, execute.
- Combine com Prompt 21 (auditoria arquitetural) e 24 (acoplamento) para visao completa.
- Nao tente zerar smells. Um projeto vivo sempre tem alguns. Controle o crescimento.

## Sinal de que deu certo

Voce tem um backlog priorizado de 10-20 refactors concretos, cada um com tamanho estimado, em vez de "tem que melhorar o codigo".
