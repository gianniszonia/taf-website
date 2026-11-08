# Current design — 8 November 2026

## Intent

Sell the feeling of a luxurious, elegant home through large, clear room photography. This is an informational showroom website, not an online shop. Photographs carry the page; text is a single line where a paragraph would do. The appointment is the goal, but it is offered as a service, never pushed: no booking buttons in the hero, no pop-ups, drawers or sticky bars.

The direction follows a review of Minotti, B&B Italia, Poliform, Molteni&C, Flexform, Baxter, Aman, Hermès, Bottega Veneta, Cartier and an official Rolex retailer (8 Nov 2026). The furniture houses keep stores and contact as quiet header/footer links. B&B Italia places a single "Book an appointment" invitation near the end of the homepage. Cartier offers it on each boutique page beside the opening hours. Rolex retailers use a calm dedicated page with a few short steps.

## Typography and spacing

Noto Serif Display, weight 300–330, is used for headings, brand names and product titles. Manrope serves body text, navigation, labels and links. Both support Latin, Greek and Cyrillic. Preserve the font loading in index.html.

The type system is small:

- one display size for page titles;
- one section-title size;
- serif card titles;
- body text at 16px;
- quiet uppercase labels at 10.5–11.5px with wide tracking.

Calls to action are underlined uppercase text links with an arrow; filled buttons appear only on form submits. The muted grey (#6f6a62) meets AA contrast on paper at caption sizes.

Headings stay restrained: the hero title is at most 80px. The client earlier found a larger, heavier hero title "too heavy/big".

Warm paper backgrounds, dark ink text and a sparing orange accent (form errors only) come from the CSS tokens. Content width is capped at 1440px with responsive 20–72px gutters. Sections breathe at 72–144px; compact ones at 48–96px.

## Homepage

Every homepage section is separated by the same visible gap, `--home-space` (88px on phones up to 176px on wide screens; slightly larger than the site-wide `--space` after the owner found 144px a little tight). Sections pad only their top, and the one before a full-bleed photo also pads its bottom. Small optical corrections cancel text line-spacing so the gaps look equal. The brand-names row under the Our Brands photo is part of that block. Each section's onward link (Explore the brands, All products, All projects, View showrooms) sits after the section content, on the left, always the same size and spacing; section headings carry no links (only the Selected pieces arrows).

1. **Hero.** Fullscreen (100svh): Borghese/Natuzzi Italia first, followed by the curated brand slides. The title is "Furnishing homes since 1965." with one quiet link, "Explore the brands". A thin bottom bar holds the current brand name and slide lines. There is no appointment call to action here.
2. **Header.** Transparent over the hero and solid on scroll. Nav: **Collection** · Inspiration · Showrooms · Our Story, then a visible language switch and two plain links, "Book an appointment" and "Contact us". Collection opens a full-width panel below the header whose content starts directly beneath the Collection button: Our Brands first (All brands plus all 16 brands; the seven without a page link to their official website in a new tab, marked ↗), then Products (All products plus each category), each list running down two columns, and a brand photograph captioned "New in <brand>" linking to that brand. The photo is cropped to fill the space up to the right edge of "Contact us" and ends level with the last list item, with extra space between the lists and the photo. The photo is chosen at random each time the panel opens and changes every 4.5 seconds while it stays open (it does not change when reduced motion is on). The header turns solid while it is open. Below 1360px the menu button takes over, there is no Collection panel, and the menu lists Our Brands, Products, Inspiration, Showrooms and Our Story, then "Book an appointment" and "Contact us".
3. **Story statement.** Centred: "Three generations. One belief: a beautiful home begins with you." Below it, three scroll-triggered counters (years since 1965, brands, showrooms) and an Our Story link.
4. **Our Brands.** A full-bleed photograph, up to full viewport height, with the selected brand name overlaid large. Brand names along the bottom select it on hover or click, with a gentle cross-fade. On phones (below 760px) the section becomes a swipe carousel instead: the title "Our Brands" with a "1 / 9" counter, then one large 4:5 brand photograph per card with the brand name and origin over it, the next card peeking in; each card opens that brand. No list of names. Brands without approved high-resolution photos remain external links beneath.
5. **Selected pieces.** Heading row: title on the left, counter and arrows at the top right (aligned to the optical middle of the lowercase serif title). "All products" follows the carousel, on the left. 12 random room images per document load from the curated Selected pieces list, excluding other homepage photography. Two large 3:2 cards per view on desktop. Desktop arrows; smaller screens swipe with the next card peeking. No automatic changes.
6. **Inspiration.** Three projects in source order: the first wide (21:9), then two side by side. On phones: a swipe row of 3:2 project photographs matching Selected pieces, with uniform stacked captions and a "1 / 3" counter. The row reveals as a whole so animated cards do not create inner vertical scrolling.
7. **Showrooms.** Four cities with address, phone and opening status. On phones: a swipe row of showroom cards with a "1 / 4" counter.
8. **Invitation.** The last section before the footer. A full-width photograph at its natural 16:9 ratio, with "Experience it in person." overlaid, one sentence, and a "Book an appointment" link to the appointment page. On phones the copy sits below the photograph.
9. **Footer.** Dark footer with tagline, brand links to external websites, showrooms, site links (including the appointment page) and social links.

## Appointment page (#/appointment)

The appointment is a calm page of its own, reached only when the visitor chooses it. Links carry context through the query string: `store`, `interest` and `piece` (for example from a product viewer or a showroom).

- **Desktop layout:** a large photograph sits sticky on the left. When the visitor came from a brand, it shows that brand's feature photograph. On the right: the label "Book an appointment", the title "A visit, at your pace.", a two-sentence invitation, then the request in three numbered parts.
  1. **Where:** showroom and interest.
  2. **When:** custom calendar and time.
  3. **About you:** name, phone, optional email and notes.
- **Tablet and phone layout:** the page stacks with the photograph on top.
- **Alternative:** below the form, the showroom phone numbers offer "Or simply call us".
- **Confirmation:** a quiet thank-you replaces the form in place.
- **Demo only:** the form never sends anything.
- **Dividers:** spacing separates the numbered parts; field underlines and control outlines remain.

## Other pages

- **Brand pages** (the introduction is the full brand description from brand.json `intro`; the short `speciality` tag is only a fallback)
  - Full-height hero photograph with the brand name.
  - One centred serif sentence about the brand and an official-website link.
  - A sticky category filter that stays within the gallery.
  - The gallery runs in a steady rhythm: one wide 16:9 photograph, then two pairs of 3:2. On phones all photographs are 3:2.
  - Ends with an invitation for that brand and a large "Next brand" link.
- **Products (#/products):** title and one line, then every published piece in source brand order. Wide screens put a sticky left sidebar with Category and Brand lists. Each list is ordered by number of pieces and shows the top six plus "Show N more". Several options can be chosen in each list (click again to unselect; "All" clears it), and results match any chosen brand and any chosen category. Chosen options stay visible, counts follow the other filter, empty combinations are disabled, and the sidebar has no scrollbar of its own: when it is taller than the screen it scrolls with the page until its last option is visible, then holds there. This sits beside three columns of 3:2 cards showing name and "brand · category". Tablets and phones put the filters above the grid as two horizontally scrolling chip rows (empty options hidden), with two columns of cards on tablets and one on phones. The page ends with the appointment invitation.
- **Brands index:** two columns of 3:2 covers, then external links for link-only brands. Neither brand pages nor the index use pagination.
- **Inspiration index:** every source project with at least three high-resolution photographs (20 of 22), in source order.
  - **Featured project:** the first project fills the screen, with its title, architect credit, photo count and "View the project". One centred serif line follows.
  - **Mosaic:** the rest form an editorial mosaic of repeating blocks (big + tall, three equal, two wide, tall + big), so every row is full and there are never gaps. Tablets and phones use full- and half-width tiles. Titles sit on the photographs.
  - **Hover preview:** on desktop only, resting the mouse on a tile fades through up to three more of its photos, which load on first hover.
- **Inspiration projects:** title, then the always-visible project story (architect credit with link and photo count on the left, the full translated description on the right; stacked on phones), then a large photograph stage (up to 78vh) with thumbnails, "Brands in this project" (only brands named in the project's own description: brands with pages as photo cards, link-only brands as external links), an invitation and a "Next project" link.
- **Our Story:** company introduction and history. Seven archive tabs show taller images (480px desktop, 320px mobile), cover fit with center-top positioning. No enlarger and no appointment section on this page.
- **Showrooms:** addresses, telephone numbers, hours and related Natuzzi details. Each showroom offers "Book an appointment", which preselects that showroom, and directions.
- **Contact (#/contact):** a page of its own, never a drawer or pop-up. Title and one-line introduction across the top; beneath them, email, head-office phone, showroom phones and "Book an appointment" on the left and the message form on the right under a small heading "Or send us a message", starting at the same height (stacked on phones). Demo-only.
- **Viewers:** the product viewer and the project photo viewer use warm paper backgrounds and backdrops, matching the site. They share light outlined navigation buttons with dark arrows and a dark-on-light counter on wide screens. Below 860px there are no arrow buttons: visitors swipe left/right anywhere in the viewer (photo, text or buttons; mostly vertical drags are ignored), a small "3 / 56" pill sits on the photo, and the product photo starts below the close button at its natural proportions (no dark bars).
- **Product viewer:** image above details at every width, scrolling as one surface. Desktop photographs retain their natural proportions in a centred frame up to 1000px wide; details follow directly below. Stays minimal: photograph, title, brand and category, "Book an appointment" (to the appointment page with brand and piece prefilled) and "Official website". Never add speculative specifications or descriptions.

## Motion and interaction

- **Hero zoom:** the hero background zooms from 1 to 1.09 over 14 seconds. Each slide stays visible for seven seconds before a 1.2-second cross-fade.
- **Hero transitions:** the outgoing transform is preserved during transitions to avoid snapping, and the next slide is preloaded. Hero text appears in a restrained sequence.
- **Brand heroes:** the same slow zoom.
- **Scroll reveals:** below-fold content uses a 0.9-second fade with a 14px rise; avoid nested reveals. Already-visible content must not disappear on navigation or Back restoration.
- **Counters:** story counters start when scrolled into view.
- **Clickable photographs:** a slow, slight zoom on hover and keyboard focus. Decorative and archive images do not imply clickability.
- **Reduced motion:** reduced-motion preferences disable all animation.
- **Navigation:** the logo on home scrolls to the top. Browser Back/Forward restores position, including the brand selection and carousel position.

## Images and performance

- **Sizes:** every photo lists all its generated sizes (`srcset`, using pixel widths the build records in `ws`), together with how wide it is shown (`sizes`). Phones download the small files and large screens get the sharp ones.
- **Helpers:** in `app.js`, always use `photo(image, alt, sizes)` with one of the `SIZES` presets, never a bare `.lg` URL.
- **Loading:** only the first hero slide, brand and inspiration heroes, and gallery stages load immediately; everything else loads lazily.
- **Fonts:** only the weights in use are loaded (Manrope 400–600, Noto Serif Display 300–400, no italics).

## Quality checks

- **Coverage:** check desktop, tablet and phone widths, all three languages, long names, cropping, keyboard focus, reduced motion, scrolling and Back/Forward.
- **Layout:** no horizontal page overflow.
- **Image quality:** the criterion is actual visible clarity, not file size alone. Historical and complete project galleries are deliberate exceptions to room-only brand imagery.
