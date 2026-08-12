# Kid settings saves

The parent-facing kid settings page uses independent manual-save forms for
Allowance, Spending Account, Savings Account, and Child details.

## Behavior

- Editing a section marks only that section as dirty and reveals its **Save
  changes** and **Cancel** actions. There is no autosave timer.
- Saving sends only the fields owned by that section through the partial
  `child.update` procedure. Drafts in other sections are neither submitted nor
  reset.
- A pending save disables only its section. Success resets that section's dirty
  baseline to the submitted values, shows the settings-saved toast, and
  invalidates the child-settings query consumers.
- A failed save keeps the draft and displays the server error in that section.
  Cancel restores the latest successfully saved values without a mutation.
- Validation schemas and the tRPC input schema live in the client-safe
  `src/lib/child-settings-schema.ts` module so client and server preserve the
  same wire constraints.

Currency accounts, sign-in editors, and danger-zone actions remain separate
workflows and do not participate in section saves.
