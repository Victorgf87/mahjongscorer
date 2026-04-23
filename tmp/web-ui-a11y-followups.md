# Web UI / accessibility follow-ups (Mahjongstats)

Residual work after layout, auth labels, flash `aria-live`, navbar focus, hands recording buttons, hand analysis upload label, leaderboard avatar sizing, and partial `transition-all` cleanups.

## High value

1. ~~**Hands recording (`app/views/hands/new.html.erb`)**~~  
   Done: logic lives in `app/javascript/controllers/hand_recorder_controller.js` (Stimulus on the form; no inline script).

2. **Global form focus**  
   Align `form-input-dark` and other shared input classes in `app/assets/tailwind/application.css` to use `focus-visible:` instead of `focus:` where appropriate so focus rings do not show on pointer clicks.

3. **`transition-all` sweep**  
   Many views still use `transition-all` (home, tournaments, games index/new, events form submit, players show/index, etc.). Replace with explicit properties (`transition-[transform,opacity]`, `transition-colors`, etc.) per performance guidelines.

## Medium value

4. **Logo / brand link**  
   Navbar logo link now inherits focus ring via wrapper; verify visual overlap with rounded logo box and adjust padding if needed.

5. **Skip link**  
   Manually verify tab order and visibility on Safari/Firefox (fixed positioning + `translate`).

6. **Flash + Turbo**  
   Confirm screen readers announce flash updates on partial page morphs; adjust `aria-live` level if notices feel too noisy.

7. **Destructive / irreversible actions**  
   Guidelines prefer confirmation or undo; audit `button_to` / `data-turbo-confirm` coverage (e.g. undo hand, end game) for consistency.

8. **Images**  
   Spot-check `image_tag` usages (players index, events cover, sekai dashboard, etc.) for explicit `width`/`height` or stable aspect containers to limit CLS.

## Lower priority / polish

9. **Reduced motion**  
   Extend `prefers-reduced-motion` beyond hands form (e.g. leaderboard hero blur, hover scales on marketing cards).

10. **Typography**  
    Apply `text-balance` / `text-pretty` on selected headings if widows become visible.

11. **Tables**  
    Ensure numeric columns use `tabular-nums` where comparisons matter (already on leaderboard rating column).

12. **Locale**  
    Guidelines suggest `Intl.*` for dates/numbers; Rails `l`/`number_with_delimiter` may suffice—document choice if adding client-side formatting later.

## Reference

- Skill: `.agents/skills/web-design-guidelines/SKILL.md` (fetches live rules from Vercel web-interface-guidelines `command.md`).
