# Desktop Nav Audit — 2026-04-27

**Goal:** identify nav surface asymmetries between mobile and desktop in the
logged-in app shell. Triggered by Rasheid noticing the menu showed links on
mobile that didn't appear on desktop. Audit only — no nav code changed in
this commit.

## Surfaces inventory

The logged-in app uses three nav surfaces, all wired through `AppShell`
(`src/components/app/AppShell.tsx`):

- **Desktop sidebar** — `SideNav` (`src/components/app/SideNav.tsx`),
  `hidden md:flex`. 260px sticky column. Logged-in only.
- **Mobile top bar** — `AppHeader` (`src/components/app/AppHeader.tsx`),
  `md:hidden`. 56px sticky strip across the top. Logged-in only.
- **Mobile bottom tabs** — `BottomNav` (`src/components/app/BottomNav.tsx`),
  `md:hidden`. 5 tabs along the bottom edge.

Both `AppHeader` (mobile) and `SideNav` (desktop) render the same
`<UserMenuItems>` component (`src/components/app/UserMenu.tsx`) — so the
contents of the avatar/user menu are identical between surfaces. Confirmed
by reading both files: the item list (mode toggle, settings, profile,
family, idea, admin, about, privacy, terms, install app, sign out, sign
out everywhere) is shared.

The 5 primary nav tabs are also shared: `NAV_TABS` in
`src/components/app/nav-config.ts` is the single source of truth, consumed
by both `BottomNav` and `SideNav`. Both surfaces show: home, calendar,
camps, saved, family.

The public pages (logged-out) use a different component,
`PublicTopBar` (`src/components/public/PublicTopBar.tsx`); its desktop
inline-nav row and mobile horizontal-scroll row carry the same 4 links
(camps, breaks, list-your-camp, about). No asymmetry there — out of scope
for this audit.

## Links rendered on each surface (logged in)

### Desktop sidebar (SideNav)

- Logo → `/${locale}/app`
- Home (NAV_TABS) → `/${locale}/app`
- Calendar (NAV_TABS) → `/${locale}/app/calendar`
- Camps (NAV_TABS) → `/${locale}/app/camps`
- Saved (NAV_TABS) → `/${locale}/app/saved`
- Family (NAV_TABS) → `/${locale}/app/family`
- 💡 Idea button (top-level) — opens FeatureRequestModal via
  `so-open-feature-request` custom event
- Language toggle (`LanguageToggleMobile` — yes, the mobile-named one;
  it's used here too)
- User block at bottom → opens `UserMenuItems` popover

### Mobile top bar (AppHeader)

- Logo → `/${locale}/app`
- 🔔 Bell button → opens `NotificationsDrawer`
- Avatar button → opens `UserMenuItems` sheet

### Mobile bottom tabs (BottomNav)

- Home (NAV_TABS) → `/${locale}/app`
- Calendar (NAV_TABS) → `/${locale}/app/calendar`
- Camps (NAV_TABS) → `/${locale}/app/camps`
- Saved (NAV_TABS) → `/${locale}/app/saved`
- Family (NAV_TABS) → `/${locale}/app/family`

### User menu (UserMenuItems — shared across mobile sheet + desktop popover)

- Identity block (display name + email)
- Mode toggle button (parent ↔ kid)
- ⚙️ Settings → `/${locale}/app/settings`
- 👤 Profile → `/${locale}/app/settings`  *(same href as Settings)*
- 👨‍👩‍👧 Family → `/${locale}/app/family`
- 💡 Idea button → fires `so-open-feature-request` event
- 🛡️ Admin → `/${locale}/admin`  *(only when isAdmin=true)*
- ℹ️ About → `/${locale}/about`
- 🔒 Privacy → `/${locale}/privacy`
- 📄 Terms → `/${locale}/terms`
- Install app (PwaInstallButton)
- 🚪 Sign out
- 🌐 Sign out everywhere

## The asymmetry

Rasheid's read was correct in spirit — the surfaces are mismatched — but
the direction is the opposite of what he flagged. The actual asymmetry is
**desktop has no path to notifications**, not mobile having extra links.

Mobile-only nav element:

| Element | Where on mobile | Where on desktop | Note |
|---|---|---|---|
| 🔔 Bell / NotificationsDrawer | AppHeader top bar (always visible) | **nowhere** | Desktop users have no surface to see notifications |

Desktop-only nav elements:

| Element | Where on desktop | Where on mobile | Note |
|---|---|---|---|
| 💡 Idea button as top-level chrome | SideNav, big gold-outline button | Buried inside avatar menu | Mobile parents must tap avatar → scroll to find Idea. Acceptable secondary placement, but discoverability differs. |
| Language toggle (EN/ES) as top-level chrome | SideNav, inline in nav area | **Only inside the Settings page** | Mobile parents who want to change language must navigate to Settings first. Not in `UserMenuItems`. |

What's NOT asymmetric (both surfaces match):

- 5 primary nav tabs (NAV_TABS) — identical via shared config
- Avatar / user menu contents — identical via shared `UserMenuItems`
- Logo, mode toggle, sign-out flows — identical

## Why Rasheid saw "mobile shows links desktop doesn't"

Best guess on the root: the mobile avatar menu (sheet) and the desktop
user block popover both render the *same* `UserMenuItems`, so
content-wise they're identical. But the visual presentation differs:

- On mobile, tapping the avatar opens a **full-width sheet** that lists
  every user-menu item top-to-bottom — Idea, About, Privacy, Terms,
  PWA install, etc. A parent scanning that sheet sees ~12 items
  prominently displayed.
- On desktop, those same 12 items live in a **small popover anchored to
  the user block at the bottom-left**. Mobile-sheet items feel "in the
  nav"; desktop-popover items feel "attached to the avatar." The eye
  may not register the popover as part of the primary nav at all.

So the perception of "more links on mobile" is real even though the
underlying item set is identical. The desktop user is mentally counting
"5 sidebar tabs + idea + lang = 7 nav items" and ignoring the user-block
popover as belonging to a different category.

## Recommended fix (for follow-up commit, not this one)

Two distinct gaps. Different urgencies.

### Gap 1 — Desktop has no notifications surface (real bug)

**Recommendation:** add a 🔔 bell to the desktop SideNav, either next to
the user block or above the nav tabs. Mount the same
`NotificationsDrawer` component AppHeader uses; it already has its own
open/close state pattern. Not a one-liner — needs styling parity with
the rest of SideNav (parent vs kid mode color shells) plus a fresh
unread indicator if/when that ships.

Estimated effort: ~30 lines in SideNav.tsx, no new components.

### Gap 2 — Discoverability mismatch between desktop and mobile

**Recommendation (mild):** add a Language toggle entry to
`UserMenuItems` so mobile parents can change language without
navigating to Settings. The toggle already exists as a component
(`LanguageToggleMobile`) — drop it in between the existing PWA install
and sign-out blocks.

Estimated effort: ~10 lines in UserMenu.tsx.

**Recommendation (mild):** consider hoisting the Idea button into
`UserMenuItems` is already done — it's there at line ~109 of UserMenu.tsx.
So Idea is actually accessible on both surfaces. Nothing to do.

### Anti-recommendations

- Do **not** remove the desktop SideNav idea/language buttons just to
  achieve symmetry. Those are good top-level affordances on a wide
  screen and removing them would degrade desktop UX.
- Do **not** add a bottom-tabs surface to desktop. The whole point of
  the SideNav is that desktop has the room for a vertical primary nav.
- Do **not** widen NAV_TABS beyond 5 — the mobile bottom tab bar can't
  comfortably show more than 5 tap targets, and any sixth tab would
  squeeze the existing five.

## Trivial fix shipped in this audit commit

None. Both gaps are at least ~10–30 lines of careful component work
that needs design review (where to put the bell, what unread indicator
to use). Audit-only as planned.
