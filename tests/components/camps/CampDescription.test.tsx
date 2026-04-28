import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CampDescription } from '@/components/camps/CampDescription';

describe('CampDescription', () => {
  it('returns null for null description', () => {
    const { container } = render(<CampDescription description={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null for empty-string description', () => {
    const { container } = render(<CampDescription description="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders **bold** as <strong>', () => {
    const { getByText } = render(
      <CampDescription description="**Sessions:** test" />,
    );
    expect(getByText('Sessions:').tagName).toBe('STRONG');
  });

  it('renders *italic* as <em>', () => {
    const { getByText } = render(
      <CampDescription description="*Note: pricing not published*" />,
    );
    expect(getByText('Note: pricing not published').tagName).toBe('EM');
  });

  it('renders bullet lists', () => {
    const { container } = render(
      <CampDescription description={'- Item 1\n- Item 2\n- Item 3'} />,
    );
    const list = container.querySelector('ul');
    expect(list).toBeTruthy();
    expect(list?.children.length).toBe(3);
  });

  it('renders nested bullet lists', () => {
    const { container } = render(
      <CampDescription description={'- Outer\n  - Inner 1\n  - Inner 2'} />,
    );
    const outerList = container.querySelector('ul');
    const innerList = outerList?.querySelector('ul');
    expect(innerList).toBeTruthy();
    expect(innerList?.children.length).toBe(2);
  });

  it('renders ordered lists', () => {
    const { container } = render(
      <CampDescription description={'1. First\n2. Second'} />,
    );
    const ol = container.querySelector('ol');
    expect(ol).toBeTruthy();
    expect(ol?.children.length).toBe(2);
  });

  it('renders \\n\\n as separate paragraphs', () => {
    const { container } = render(
      <CampDescription description={'First paragraph.\n\nSecond paragraph.'} />,
    );
    expect(container.querySelectorAll('p').length).toBe(2);
  });

  it('renders links as new-tab with rel=noopener', () => {
    const { container } = render(
      <CampDescription description="See [our site](https://example.com)" />,
    );
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');
    expect(link?.rel).toContain('noreferrer');
  });

  it('does not render images (Phase A scope)', () => {
    const { container } = render(
      <CampDescription description="![alt](https://example.com/img.png)" />,
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('does not execute embedded HTML script tags', () => {
    // react-markdown v10 escapes raw HTML by default; the literal string
    // appears as text but the <script> never enters the live DOM.
    const { container } = render(
      <CampDescription description={"<script>alert('xss')</script>Hello"} />,
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('uses ink text color in default (light) mode', () => {
    const { container } = render(
      <CampDescription description="Just some text." />,
    );
    const p = container.querySelector('p');
    expect(p?.className).toContain('text-ink');
    expect(p?.className).not.toContain('text-white');
  });

  it('uses white text color in darkMode (kid-mode app surface)', () => {
    const { container } = render(
      <CampDescription description="Just some text." darkMode />,
    );
    const p = container.querySelector('p');
    expect(p?.className).toContain('text-white');
  });

  it('uses brand-purple link color in light mode', () => {
    const { container } = render(
      <CampDescription description="See [site](https://example.com)" />,
    );
    const link = container.querySelector('a');
    expect(link?.className).toContain('text-brand-purple');
  });

  it('uses gold link color in darkMode for contrast against purple-deep bg', () => {
    const { container } = render(
      <CampDescription description="See [site](https://example.com)" darkMode />,
    );
    const link = container.querySelector('a');
    expect(link?.className).toContain('text-gold');
  });

  it('renders the TGP-style multi-section description without crashing', () => {
    // Smoke test: replicate the actual TGP description shape (inserted by
    // migration 053) — opening paragraph, **bold heading**, mixed-depth
    // bullets, **bold inline**, more bullets. If react-markdown chokes on
    // any of this we want a clear test failure, not a prod 500.
    const desc = [
      "Stomp, chomp, and ROAR your way into a dino-mite summer adventure!",
      "",
      "**Sessions:**",
      "- **Session One:** June 15 – July 2, 2026",
      "  - Week 1: How Do Dinosaurs Play with Their Friends?",
      "  - Week 2: How Do Dinosaurs Say I Love You?",
      "",
      "**Camp activities:** Arts & Crafts, Cooking, STEM Lab.",
      "",
      "**Two daily schedule options:**",
      "- **Half-day** (9:00 AM – 12:30 PM): $700/session",
      "- **Full-day** (9:00 AM – 3:00 PM): $800/session",
    ].join('\n');
    const { container } = render(<CampDescription description={desc} />);
    // At least one ul, at least one strong, multiple paragraphs.
    expect(container.querySelector('ul')).toBeTruthy();
    expect(container.querySelector('strong')).toBeTruthy();
    expect(container.querySelectorAll('p').length).toBeGreaterThanOrEqual(2);
  });
});
