# Maestro Development Workflow

## Purpose

Use this workflow whenever I ask you to:

- Create functionality
- Change functionality
- Extend functionality
- Fix a bug
- Improve an existing feature

The expected result is working functionality integrated into the existing website, connected to the correct data, verified, tested, and checked with the project's existing quality tools.

## 1. Understand the request

Start by reading the task carefully.

Then inspect the relevant project structure and code.

Look at relevant:

- Routes
- Controllers
- Repositories
- Models/entities
- Services if present
- Twig templates
- Forms
- JavaScript if relevant
- Existing tests
- Configuration
- Similar existing features

Do not design a replacement architecture before understanding how the project currently works.

Determine:

- What the user should be able to do
- What data is involved
- Where the data currently comes from
- Who is allowed to perform the action
- What validation is needed
- What important failures can occur
- What the user should see when they occur

## 2. Clarify important requirements

Ask questions only when missing information could materially change the implementation.

Important examples include:

- Who has permission?
- Is an action destructive?
- Is deletion permanent or recoverable?
- Who owns the data?
- What happens when a requested resource does not exist?
- What happens when the user is unauthorized?
- What validation rules are required?
- What should happen after success?
- What should the UI show after failure?
- Should functionality be hidden or shown but forbidden?
- Does a data change need to preserve historical behaviour?

Stop before implementation if an important ambiguity remains.

Do not stop for small implementation choices that can safely be inferred from existing conventions.

## 3. Define failure behaviour

Treat failure states as explicit product behaviour.

For important failure cases, determine whether the application should:

- Show a clear message
- Display a not-found page/state
- Display a forbidden page/state
- Redirect
- Preserve submitted data and display validation errors
- Hide functionality
- Retry
- Use another explicitly requested behaviour

Expected errors should not result in uncontrolled application crashes.

Do not use broad exception handling merely to hide defects.

## 4. Plan within the existing architecture

Preserve:

- Existing MVC structure
- Repository Pattern
- Naming conventions
- Directory structure
- Routing style
- Controller style
- Twig conventions
- Testing style
- Existing dependencies
- Existing application flow

Prefer the smallest clean implementation that solves the full task.

For normal server-rendered features, prefer:

`repository → controller → Twig`

Introduce a service class when substantial business logic warrants one.

Do not introduce a service merely for architectural purity.

Introduce an API only when it provides real value, such as:

- Dynamic frontend interactions without full page reloads
- A reusable endpoint
- Multiple clients needing the same data
- Existing project architecture already using an endpoint for the same type of feature

Do not make the project API-driven by default.

## 5. Implement end-to-end

A feature is not complete if only one layer has been changed.

Implement all required layers.

Depending on the feature, this can include:

### Data layer

- Repository methods
- Queries
- Persistence
- Transactions
- Existing model/entity changes
- Migration changes

### Business logic

- Calculations
- Validation rules
- Domain rules
- Transformations
- Reusable logic

### Controller

- Input handling
- Repository/service interaction
- Authorization
- Validation
- Responses
- Redirects
- Error handling

### Twig/frontend

- Forms
- Results
- Buttons/actions
- Validation messages
- Empty states
- Help text
- Confirmation UI
- Success/error feedback

### Frontend scripting

Use JavaScript only where it improves the actual workflow.

Do not move important validation or security exclusively to the browser.

### Integration

Use relevant existing application data.

Do not create disconnected duplicate data flows.

## 6. Security review during implementation

For every feature, consider:

### Input validation

Validate user-controlled data on the server.

Consider:

- Required fields
- Types
- Ranges
- Formats
- Identifiers
- Enumerated values
- Uploaded files if relevant
- Unexpected fields

### Authorization

Check authorization server-side.

Do not assume users cannot access an action simply because the UI hides it.

### CSRF

Use the project's existing CSRF approach for relevant state-changing requests.

### Output

Use normal Twig escaping unless raw output is deliberately required.

### Raw HTML

If a feature generates or accepts HTML:

- Distinguish trusted generated markup from arbitrary HTML
- Avoid globally disabling escaping
- Prefer allowlisting permitted elements/attributes when practical
- Prevent scripts and unsafe URLs
- Keep raw rendering localized
- Make security decisions explicit

### Error information

Do not expose sensitive internal information through user-facing errors.

### Destructive actions

Verify authorization and intended deletion behaviour.

Use confirmation where appropriate.

## 7. Usability review

Remember that users are mainly non-technical colleagues.

Check whether the interface:

- Uses understandable wording
- Avoids technical jargon
- Makes the main action obvious
- Shows units
- Gives sensible defaults
- Explains unusual inputs
- Displays validation next to the relevant fields
- Shows useful empty states
- Gives clear success feedback
- Gives actionable error messages
- Produces output that fits the actual work process

Use contextual help, question-mark icons, tooltips, or short explanations where they provide real value.

Do not overload the page with unnecessary instructions.

## 8. Manual verification

Before relying on automated tests, verify the actual functionality.

Check the primary success path.

Also check relevant failure scenarios such as:

- Invalid input
- Missing resource
- Unauthorized access
- Forbidden action
- Duplicate operation
- Empty data
- Unexpected but valid boundary values

Confirm that related existing functionality still works.

If the environment prevents manual verification, state that instead of pretending the behaviour was checked.

## 9. Automated tests

After implementation and behavioural verification, write automated tests for the new or changed functionality.

Tests must verify meaningful behaviour.

Good tests cover things like:

- Correct output
- Correct persistence
- Correct redirect
- Correct response status
- Validation errors
- Authorization
- Missing records
- Edge cases
- Regression behaviour

Avoid tests that only confirm implementation details unless those details are part of the required contract.

### Test integrity

Never:

- Remove meaningful assertions merely to get green tests
- Narrow a valid test to stop it finding a bug
- Change correct expected behaviour to match broken implementation
- Over-mock code so the real behaviour is no longer tested

When a test exposes a real defect, fix the implementation.

Treat meaningful existing tests as part of the specification unless the requested behaviour explicitly changes that specification.

## 10. Quality checks

Discover the project's configured commands before inventing new ones.

Check places such as:

- `composer.json`
- `package.json`
- Makefiles
- CI configuration
- Project documentation
- Tool-specific config files

Run applicable:

- Test suite
- Linter
- Formatter/style check
- Static analysis
- Type checker

Fix legitimate issues.

Do not:

- Silence valid warnings without justification
- Lower quality thresholds merely to pass
- Add broad ignores for code you just introduced
- Claim tools passed if they did not run successfully

## 11. Review the final diff

Before completion, review all changes.

Look for:

- Accidental unrelated edits
- Missing authorization
- Missing validation
- Unsafe output
- Inconsistent naming
- Dead code
- Duplicate logic
- Incorrect error states
- Missing frontend integration
- Missing tests
- Unnecessary dependencies
- Debug statements
- Secrets
- Temporary code
- Comments that no longer match behaviour

Do not leave unrelated cleanup mixed into the feature unless necessary.

## 12. Bug-fix workflow

When fixing a bug:

1. Identify or reproduce the actual defect.
2. Understand its cause.
3. Fix the cause rather than only the visible symptom.
4. Verify the corrected behaviour.
5. Add or update a regression test.
6. Run relevant quality checks.
7. Review for related regressions.

Never change a correct test merely because the current implementation fails it.

## 13. Dependencies

Before adding a new package:

1. Check existing dependencies.
2. Check whether the functionality can be implemented cleanly without another dependency.
3. Prefer an existing suitable package if one is already present.

Ask me before adding dependencies with meaningful:

- Security implications
- Licensing considerations
- Infrastructure implications
- Maintenance burden
- Architectural impact

## 14. Database and persistent data

Follow the project's existing migration conventions.

Consider:

- Existing data
- Null/default values
- Indexes
- Foreign keys
- Backward compatibility
- Deployment ordering
- Rollback
- Data migration requirements

Never casually delete, overwrite, or irreversibly transform production data.

If the intended destructive behaviour is unclear, ask first.

## 15. Git safety

Respect existing working-tree changes.

Do not:

- Reset my uncommitted work
- Clean untracked files without permission
- Revert unrelated changes
- Rewrite history
- Force push
- Delete files unrelated to the task

Do not make commits unless requested or clearly part of the environment's normal workflow.

Never commit credentials or secrets.

## 16. Scope control

Solve the requested problem completely, but avoid unrelated refactoring.

Small local cleanup is acceptable when it directly improves the changed implementation.

If you discover a larger unrelated issue:

- Do not silently expand scope
- Mention it separately
- Leave it as a TODO unless it blocks the requested feature

## 17. Communication

Keep communication concise.

During implementation, tell me about important findings such as:

- Security problems
- Requirement conflicts
- Unexpected existing behaviour
- Architecture that changes the solution
- A meaningful failing test
- A migration risk
- An existing bug that blocks the work

Do not narrate every command or trivial edit.

## 18. Definition of done

A feature or fix is complete only when applicable items below are satisfied:

- Requirement understood
- Important ambiguity resolved
- Existing architecture followed
- Backend implemented
- Frontend implemented
- Relevant data integrated
- Validation implemented
- Authorization implemented
- Security reviewed
- Error states handled
- Manual behaviour verified
- Meaningful tests created
- Relevant existing tests pass
- Linter passes
- Static analysis passes
- Type checks pass
- Final diff reviewed

If something cannot be completed because of environment limitations, clearly state that.

## 19. Completion report

Always finish implementation work with:

### Changed files

For every meaningful changed file:

- File path
- Short explanation of the change

### Tests added

List:

- Test files changed or added
- Important scenarios covered

### Commands run

List the commands actually run, for example:

- Tests
- Linter
- Static analysis
- Type checker

Include whether each succeeded.

Do not list a command as successful unless it actually ran successfully.

### Remaining risks / TODOs

Mention:

- Known limitations
- Deployment considerations
- Required migration steps
- Environment limitations
- Remaining manual checks
- Follow-up work

If nothing remains, write:

`None.`
