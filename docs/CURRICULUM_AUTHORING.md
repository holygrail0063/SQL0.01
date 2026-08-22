# QueryRight Curriculum Authoring

QueryRight exercises validate the learner's business result, not a copied SQL string. A new lesson is not complete until the prompt, data, reference SQL, validation policy, hints, and tests all agree.

## Exercise Contract

Every graded exercise needs:

- Clear business request.
- Supported SQLBank dialect syntax.
- Hidden `reference_sql` that executes successfully.
- Validation policy, explicit or inferred from `comparison_mode`.
- Success criteria that match the validator.
- Level-specific guidance.
- At least one beginner-mistake test.

## Prompt Rules

- Use "Return only..." when extra columns should fail.
- Use "Return..." for exact requested columns unless extras are explicitly allowed.
- Use "Include..." when extra reasonable columns may be accepted.
- Use "Return every..." when `SELECT *` or an explicit full column list should be valid.
- State ordering requirements in the prompt when order matters.
- State aliases in the prompt when aliases are required.

## SQL Dialect

SQLBank teaches SQL Server-style SQL for the current product.

- Text literals use single quotes: `WHERE Province = 'Ontario'`.
- `TOP n` is supported for ranked lists.
- Avoid teaching double-quoted text literals.
- Do not introduce syntax unless the in-memory engine and SQL Server mode both support it well enough for learners.

## Definition Of Done

Before a course/module ships:

- Canonical solution passes.
- Alternative correct SQL passes when semantically equivalent.
- Formatting/capitalization variations pass.
- Wrong filters fail with useful feedback.
- Zero-row results preserve columns.
- Ordered tasks reject wrong order.
- Duplicates, NULLs, dates, and decimals compare correctly.
- Stages map to the correct challenge IDs.
- `npm test`, `npm run validate:curriculum`, and `npm run build` pass.

## Good Exercise

Prompt: "Return only CustomerID, Province, and City from Customers."

Contract:

- `columnPolicy = exact`
- `rowPolicy = exact_multiset`
- `orderPolicy = ignore`
- Extra columns fail because the prompt says "only."

## Bad Exercise

Prompt: "Show customer details for Ontario."

Problem:

- "details" is vague.
- Validator cannot know whether extra fields are required or allowed.
- Rewrite with explicit columns or "every customer column."
