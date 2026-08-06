# Prompt 29 — Verificacao de Cobertura Real vs Aparente

**Categoria:** Qualidade, Testes e Seguranca
**Objetivo:** Detectar o engano mais comum em projetos com testes: alta cobertura de linhas + baixa cobertura de comportamento. Ou seja, o relatorio diz 85%, mas os testes nao pegariam bug nenhum.
**Quando usar:** Quando voce olha o coverage report e ele parece bom, mas bugs aparecem no codigo "coberto". Ou periodicamente em projetos maduros para calibrar a confianca real nos testes.

---

## PROMPT

```
Quero que voce auditore a cobertura REAL de testes deste projeto, nao a cobertura aparente. A diferenca: cobertura aparente conta linhas executadas. Cobertura real conta comportamentos verificados.

## Protocolo

### Etapa 1 — Baseline numerico

1. Rode a suite com coverage (npm test -- --coverage, pytest --cov, go test -cover, etc).
2. Anote: cobertura de linhas, de branches, de funcoes, de arquivos.
3. Identifique os 5 arquivos com MAIOR cobertura de linhas.

### Etapa 2 — Verificacao manual dos top-coverage

Para cada um dos 5 arquivos com alta cobertura, va nos testes correspondentes e verifique cada criterio:

#### Criterio 1 — Assercoes sao triviais?

Conte quantos `expect(...)` tem cada teste. Se um teste tem 1 assercao tipo `expect(result).toBeTruthy()`, isso nao e assercao — e placebo.

Liste: testes com assercoes fracas (truthy, notNull, defined, instanceof).

#### Criterio 2 — Valor esperado hardcoded no mock?

Se o teste mocka uma dependencia para retornar X, e depois verifica que o resultado e X, o teste nao testa nada — e um espelho. Procure por esse padrao.

#### Criterio 3 — Branches cobertas ou so o caminho feliz?

Para cada `if/else`, `switch`, `try/catch` do codigo, verifique se HA teste que entra em cada ramo. Se ha 5 if's e so 1 esta coberto, cobertura de linhas pode estar em 70% enquanto cobertura de comportamento esta em 20%.

#### Criterio 4 — Edge cases?

O arquivo manipula lista? Ha teste com lista vazia?
Manipula string? Ha teste com string vazia? Com unicode?
Manipula numero? Ha teste com 0? Com negativo? Com Infinity/NaN?

Conte quantos edge cases relevantes existem e quantos tem teste.

#### Criterio 5 — Erro?

Cada funcao que lanca erro tem teste para o caso de erro? Ou so caminho feliz?

### Etapa 3 — Pontuacao de cobertura real

Para cada um dos 5 arquivos, atribua:

- **Cobertura aparente** (% do coverage report)
- **Cobertura real** (% subjetiva sua, baseada nos criterios acima)

Diferenca grande = sinal de alarme.

### Etapa 4 — Os 5 arquivos com MENOR cobertura

Liste os 5 com menor coverage. Para cada:

- E um modulo critico? Se sim, prioridade alta para adicionar teste.
- E codigo legado? Talvez o teste so faca sentido apos refactor.
- E codigo trivial (constantes, tipos)? Pode ficar sem teste.

### Etapa 5 — Arquivos com ZERO cobertura

Liste arquivos com 0%. Para cada: e esperado (script, util, tipos) ou e lacuna?

### Etapa 6 — Testes ignorados

Grep por `.skip`, `xit`, `@Ignore`, `pytest.skip`. Liste cada um com:
- Arquivo:linha
- Comentario do porque foi skipado (se houver)
- Quanto tempo ja esta skipado (git blame)

Skipeds longos geralmente escondem bugs.

### Etapa 7 — Relatorio

Entregue `docs/claude/COBERTURA.md`:

1. **Numeros aparentes** (do report)
2. **Amostra auditada** (os 5 arquivos top + 5 bottom)
3. **Gap aparente vs real** — onde ha maior discrepancia
4. **Modulos criticos descobertos** — alta importancia, baixa cobertura real
5. **Testes skipped** — lista
6. **Recomendacoes priorizadas** — onde adicionar teste tem maior ROI

## Regras

- Nao confie cegamente no coverage report. Ele e so um sinal.
- Nao persiga 100% de cobertura. Persiga alta cobertura NOS LUGARES QUE IMPORTAM.
- Nao adicione testes para aumentar numero. Adicione testes para pegar bug real.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto sem coverage tool instalado:** peca para instalar a ferramenta padrao da stack (c8, istanbul, coverage.py, cargo-tarpaulin).

**Projeto grande (> 1000 arquivos):** amostragem. 10 arquivos no top coverage, 10 no bottom. Nao tente auditar tudo.

**Projeto que cobre tudo com e2e:** cobertura de linha via e2e e enganosa (muitas linhas executadas, poucas verificadas). Peca para separar metricas por tipo de teste.

---

## Dicas de uso

- Apresente o gap (aparente vs real) para o time. E um wake-up call.
- Nao puna cobertura baixa em codigo trivial. Celebre cobertura real em codigo critico.
- Instale coverage no CI com threshold realista (ex: 70%), nao 95%.

## Sinal de que deu certo

O time para de fazer "teste para subir cobertura" e comeca a fazer "teste para pegar bug". Incidentes em producao caem em areas que tinham cobertura fraca real.
