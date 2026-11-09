# Frontend design system

## Direction

UniConnect uses an original warm burnt-orange identity within a clear SaaS workspace. Neutral surfaces and dark readable text make up most of the interface; orange highlights actions, navigation state, links and community signals. Soft orange surfaces are reserved for selected areas such as the auth story panel. Decorative motifs reference connection and learning without university-specific branding or copying another social platform.

## Tokens

Defined at `:root` in `src/index.css`:

- Brand orange `#E85A24`, dark orange `#B84318`, light orange `#F47A45`, soft orange `#FFF4EE`.
- Main text `#1F2937`, secondary text `#667085`, border `#E5E7EB`, surface `#FFFFFF`, neutral canvas `#F9FAFB`.
- Primary buttons use light orange `#F47A45` with white labels; brand orange and dark orange carry the identity across navigation, links, badges and selected states.
- Radius 14px; smaller controls use 8–10px.
- System sans-serif typography with Georgia for selected editorial headings.
- Spacing follows 4/8px rhythm, with 12–34px content padding.
- Focus uses a visible orange outline. Reduced-motion disables animated transitions.

## Shared patterns

The client uses reusable `Heading`, `Loading`, `Notice`, `Empty`, and `Avatar` components, plus consistent buttons, cards, badges, form controls, tabs, dialogs and status labels. These are shadcn/ui-style lightweight primitives rather than a large component framework. Lucide icons are paired with text for important actions.

## Layout

Desktop uses a 225px navigation rail, flexible main column and 255px contextual rail. At 1200px the contextual rail collapses; at 760px the sidebar becomes a drawer, content becomes one column and persistent bottom navigation appears. Mobile controls preserve touch-friendly sizing where practical.

