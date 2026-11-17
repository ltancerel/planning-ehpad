import { type Locator, type Page } from "@playwright/test";

/**
 * Les formulaires d'administration (SalarieForm, UtilisateurForm…)
 * utilisent des <label> sans attribut for/id (juste un texte au-dessus du
 * champ) — getByLabel ne les reconnaît donc pas. On cible le champ
 * (input/select) qui suit immédiatement le label portant ce texte exact,
 * ce qui correspond à la structure réelle de ces formulaires.
 */
export function champParLabel(page: Page, texteLabel: string): Locator {
  return page.locator(`label:text-is("${texteLabel}")`).locator("xpath=following-sibling::*[1]");
}
