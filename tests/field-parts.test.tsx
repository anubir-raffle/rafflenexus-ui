// Field parts from the builder's third round: character counts, Copy in review mode, RichTextArea, DomainField,
// SegmentedControl, the upload tile's row slots, the preview's devices and the scrolling step bar.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DomainField, LicenceBadge, RichText, RichTextArea, SegmentedControl, Table, TextArea, TextField, UploadTile, domainUrl, richTextLength, richTextToPlain, sanitizeRichText,
  type DomainType,
} from '../src';
import { WizardPreview, WizardSitePreview, WizardSteps } from '../src/wizard';
import { TextInput } from '../src/inputs';

let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

describe('character counts', () => {
  it('TextField says how many characters are left, describes the input with it, and stops at the limit', async () => {
    function Name() { const [v, setV] = useState('Sample'); return <TextField label="Raffle name" maxLength={20} value={v} onChange={(e) => setV(e.target.value)} />; }
    render(<Name />);
    const input = screen.getByLabelText('Raffle name');
    expect(screen.getByText('14 characters left')).toHaveClass('rnc-field-count');
    expect(input).toHaveAttribute('maxlength', '20');
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByText('14 characters left').id);
    await userEvent.type(input, ' Lottery 2026');
    expect(screen.getByText('1 character left')).toHaveClass('is-near');
    await userEvent.type(input, 'X');
    expect(screen.getByText('No characters left')).toHaveClass('is-full');
  });

  it('counts an uncontrolled TextArea too, and hides the count with showCount={false}', async () => {
    const { rerender } = render(<TextArea label="Notes" maxLength={100} defaultValue="Hello" />);
    expect(screen.getByText('95 characters left')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Notes'), '!');
    expect(screen.getByText('94 characters left')).toBeInTheDocument();
    rerender(<TextArea label="Notes" maxLength={100} defaultValue="Hello" showCount={false} />);
    expect(screen.queryByText(/characters left/)).toBeNull();
  });

  it('the inputs TextInput counts with maxLength, beside its helper text', () => {
    render(<TextInput label="Heading" maxLength={30} value="Win a home" helperText="Shown at the top" onChange={() => {}} />);
    expect(screen.getByText('20 characters left')).toBeInTheDocument();
    expect(screen.getByText('Shown at the top')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading')).toHaveAttribute('maxlength', '30');
  });
});

describe('Copy in review mode', () => {
  it('a review TextField is read-only, with a Copy button inside that copies the value and says so', async () => {
    render(<TextField label="Support email" review value="help@example.org" onChange={() => {}} />);
    expect(screen.getByLabelText('Support email')).toHaveAttribute('readonly');
    expect(screen.queryByText(/characters left/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Copy Support email' }));
    expect(writeText).toHaveBeenCalledWith('help@example.org');
    expect(await screen.findByRole('status')).toHaveTextContent('Copied');
  });

  it('the inputs fields show a Copy button in review mode (disabledAll), which copies once', async () => {
    render(<TextInput label="Organization" disabledAll value="Sample Foundation" onChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy Organization' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('Sample Foundation');
  });
});

describe('RichTextArea and RichText', () => {
  it('keeps only paragraphs, line breaks, bold, italic and lists, with no attributes', () => {
    const dirty = '<div style="color:red">Hi <b onclick="x()">there</b><script>alert(1)</script><a href="javascript:x">link</a></div><ul><li class="a">One</li></ul>';
    expect(sanitizeRichText(dirty)).toBe('<p>Hi <strong>there</strong>alert(1)link</p><ul><li>One</li></ul>');
    expect(sanitizeRichText('<p><br></p>')).toBe('');
    expect(richTextLength('<p>Ab <strong>cd</strong></p>')).toBe(5);
    expect(richTextToPlain('<p>One</p><ul><li>Two</li><li>Three</li></ul>')).toBe('One\nTwo\nThree');
  });

  it('labels its box, offers the four formats, counts the text and shows the value', () => {
    render(<RichTextArea label="The cause" maxLength={50} value="<p>Hospital <em>care</em></p>" onChange={() => {}} />);
    const box = screen.getByRole('textbox', { name: 'The cause' });
    expect(box).toHaveAttribute('aria-multiline', 'true');
    expect(box.innerHTML).toBe('<p>Hospital <em>care</em></p>');
    const bar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(['Bold', 'Italic', 'Bulleted list', 'Numbered list'].map((n) => screen.getByRole('button', { name: n }))).toHaveLength(4);
    expect(bar).toHaveAttribute('aria-controls', box.id);
    expect(screen.getByText('37 characters left')).toBeInTheDocument();
  });

  it('pastes plain text only, cut to the room left', () => {
    const exec = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });
    render(<RichTextArea label="Description" maxLength={10} value="<p>Abcdef</p>" onChange={() => {}} />);
    fireEvent.paste(screen.getByRole('textbox', { name: 'Description' }), { clipboardData: { getData: () => 'Longer than four' } });
    expect(exec).toHaveBeenCalledWith('insertText', false, 'Long');
  });

  it('in review it has no toolbar, and Copy copies the text', async () => {
    render(<RichTextArea label="The cause" review value="<p>One</p><ul><li>Two</li></ul>" />);
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'The cause' })).toHaveAttribute('aria-readonly', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Copy The cause' }));
    expect(writeText).toHaveBeenCalledWith('One\nTwo');
  });

  it('RichText shows a cleaned value', () => {
    const { container } = render(<RichText html={'<p>Hi<img src=x onerror="x()"></p>'} />);
    expect(container.firstChild).toHaveClass('rnc-richtext');
    expect((container.firstChild as HTMLElement).innerHTML).toBe('<p>Hi</p>');
  });
});

describe('DomainField and SegmentedControl', () => {
  function Address({ start = 'rn' as DomainType, review = false }) {
    const [type, setType] = useState<DomainType>(start); const [value, setValue] = useState('');
    return <DomainField label="Web address" type={type} onTypeChange={setType} value={value} onChange={setValue} review={review} />;
  }

  it('shows the Raffle Nexus domain after the name, and tidies a pasted address down to the name', async () => {
    render(<Address />);
    expect(screen.getByText('.rafflenexus.com')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Raffle Nexus address' })).toBeChecked();
    fireEvent.change(screen.getByLabelText('Web address'), { target: { value: 'https://Sample-Hospital.rafflenexus.com/tickets' } });
    expect(screen.getByLabelText('Web address')).toHaveValue('sample-hospital');
    expect(screen.getByText('Full address: https://sample-hospital.rafflenexus.com')).toHaveClass('rnc-sr-only');
    expect(screen.getByLabelText('Web address')).toHaveAttribute('maxlength', '63');
    expect(screen.getByText('48 characters left')).toHaveClass('rnc-field-count');
  });

  it('switches to your own domain: no suffix, its own hint, www and paths dropped', async () => {
    render(<Address />);
    await userEvent.click(screen.getByRole('radio', { name: 'Your own domain' }));
    expect(screen.queryByText('.rafflenexus.com')).toBeNull();
    expect(screen.getByText(/or a domain you own/)).toBeInTheDocument(); // the same hint for both choices
    fireEvent.change(screen.getByLabelText('Web address'), { target: { value: 'www.Lottery.Example.org/win' } });
    expect(screen.getByLabelText('Web address')).toHaveValue('lottery.example.org');
    expect(screen.getByLabelText('Web address')).toHaveAttribute('maxlength', '253');
    expect(screen.getByText('234 characters left')).toBeInTheDocument();
    expect(domainUrl('own', 'lottery.example.org')).toBe('https://lottery.example.org');
    expect(domainUrl('rn', 'sample')).toBe('https://sample.rafflenexus.com');
  });

  it('SegmentedControl is a radio group with the chosen option marked', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl aria-label="Size" value="a" onChange={onChange} options={[{ value: 'a', label: 'Desktop' }, { value: 'b', label: 'Mobile' }]} />);
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toHaveClass('rnc-segmented');
    expect(screen.getByRole('radio', { name: 'Desktop' }).closest('label')).toHaveClass('is-on');
    await userEvent.click(screen.getByRole('radio', { name: 'Mobile' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('UploadTile rows', () => {
  it('always renders label, hint, tile and message, so tiles side by side line up', () => {
    const { container } = render(<UploadTile label="Logo" onFile={() => {}} />);
    const tile = container.querySelector('.rnc-upload')!;
    expect(tile.children).toHaveLength(4);
    expect(tile.lastElementChild).toHaveAttribute('role', 'alert');
  });
});

describe('WizardSitePreview sponsors, socials and cause media', () => {
  it('shows a presenting sponsor, prize sponsors, sponsor logos (in tiers or not), socials and the cause photo or video', () => {
    const logo = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
    const { container, rerender } = render(
      <WizardSitePreview org="Sample Foundation" heading="Win" cause="Hospital care" causeMedia={{ kind: 'image', src: logo, alt: 'The ward' }}
        sponsor={{ name: 'Sample Credit Union', logo, label: 'Presented by' }}
        prizes={[{ title: 'Home', value: '$1,000,000', sponsor: { name: 'Sample Builders', logo } }]}
        sponsors={{ tiers: [{ name: 'Gold', sponsors: [{ name: 'A', logo }] }, { name: 'Silver', sponsors: [{ name: 'B', logo }, { name: 'C', logo }] }, { name: 'Bronze', sponsors: [] }] }}
        socials={[{ label: 'Facebook', href: 'https://facebook.com/sample' }]} />,
    );
    expect(container.querySelector('.rnc-wsite-presenter')).toHaveTextContent('Presented by');
    expect(container.querySelector('.rnc-wsite-prize-sponsor')).toHaveTextContent('Sample Builders');
    expect(container.querySelector('.rnc-wsite-causeg')).toHaveClass('has-media');
    expect(container.querySelectorAll('.rnc-wsite-tier')).toHaveLength(2);
    expect(container.querySelector('.rnc-wsite-sponsors')).toHaveClass('is-lg');
    expect(container.querySelector('.rnc-wsite-socials')).toHaveTextContent('Facebook');
    rerender(<WizardSitePreview heading="Win" cause="Care" causeMedia={{ kind: 'video', src: 'blob:v' }} sponsors={[{ name: 'A', logo }]} />);
    expect(container.querySelector('.rnc-wsite-cause-media video')).toBeInTheDocument();
    expect(container.querySelectorAll('.rnc-wsite-tier')).toHaveLength(1);
  });
});

describe('WizardSitePreview prize cards and the phone header', () => {
  it('prizes are cards: the photo or a gift icon, the value, the title', () => {
    const { container } = render(<WizardSitePreview heading="Win" prizes={[{ title: 'Home', value: '$1', image: 'data:image/png;base64,AAAA' }, { title: 'Cash', value: '$2' }]} />);
    const cards = container.querySelectorAll('.rnc-wsite-prize');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.rnc-wsite-prize-media img')).toBeInTheDocument();
    expect(cards[1].querySelector('.rnc-wsite-prize-media svg')).toBeInTheDocument();
    expect(cards[1]).toHaveTextContent('$2Cash');
  });

  it('a prize card takes a caption, a note and several sponsors (logos only when there are several)', () => {
    const logo = 'data:image/png;base64,AAAA';
    const { container } = render(<WizardSitePreview heading="Win" prizes={[{ title: '50/50 jackpot', label: 'Jackpot Amount', value: 'Live jackpot', note: 'Winner takes half',
      sponsors: [{ name: 'A', logo }, { name: 'B', logo }, { name: 'C' }] }]} />);
    const card = container.querySelector('.rnc-wsite-prize')!;
    expect(card.querySelector('.rnc-wsite-prize-label')).toHaveTextContent('Jackpot Amount');
    expect(card.querySelector('.rnc-wsite-prize-note')).toHaveTextContent('Winner takes half');
    expect(card.querySelectorAll('.rnc-wsite-prize-sponsor-item')).toHaveLength(3);
    expect(card.querySelector('.rnc-wsite-prize-sponsor')).toHaveTextContent('Sponsored byC');
  });

  it('on a phone the header is the logo and a menu; the presenting sponsor sits in a bar under it', () => {
    const sponsor = { name: 'Sample Credit Union', logo: 'data:image/png;base64,AAAA', label: 'Presented by' };
    const { container } = render(<WizardPreview url="x" device="mobile"><WizardSitePreview heading="Win" sponsor={sponsor} /></WizardPreview>);
    expect(container.querySelector('.rnc-wsite-head .rnc-wsite-menu')).toBeInTheDocument();
    expect(container.querySelector('.rnc-wsite-head .rnc-wsite-btn')).toBeNull();
    expect(container.querySelector('.rnc-wsite-presenter-bar')).toHaveTextContent('Presented by');
    expect(container.querySelector('.rnc-wsite-brand .rnc-wsite-presenter')).toBeNull();
  });
});

describe('WizardPreview devices', () => {
  it('lays the site out for desktop, then for a phone, and the site follows', async () => {
    const { container } = render(
      <WizardPreview url="sample.rafflenexus.com">
        <WizardSitePreview org="Sample Foundation" heading="Win a home" packs={[{ label: '3 tickets', price: '$60' }]} dates={[{ when: 'Oct 17', what: 'Sales close' }]} licence="BC Gaming Event Licence #000000" />
      </WizardPreview>,
    );
    expect(container.querySelector('.rnc-wizard-browser-page')).toHaveStyle('width: 1280px');
    expect(container.querySelector('.rnc-wsite')).toHaveClass('is-desktop');
    expect(screen.getByText('Choose a pack')).toBeInTheDocument();
    expect(screen.getByText('Sales close')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Mobile' }));
    expect(container.querySelector('.rnc-wizard-preview')).toHaveClass('is-mobile');
    expect(container.querySelector('.rnc-wizard-browser-page')).toHaveStyle('width: 390px');
    expect(container.querySelector('.rnc-wsite')).toHaveClass('is-mobile');
    expect(screen.getByRole('img', { name: 'Preview of the raffle site on a phone' })).toBeInTheDocument();
  });
});

describe('WizardSteps when it scrolls sideways', () => {
  it('has a track and an arrow at each end, kept out of the tab order and the accessibility tree', async () => {
    const steps = ['Website', 'Slideshow', 'Dates', 'Licences', 'Prizes', 'Review'].map((label) => ({ label, state: 'incomplete' as const }));
    const { container } = render(<WizardSteps steps={steps} current={0} onSelect={() => {}} layout="v2" />);
    expect(container.querySelector('.rnc-wizard-steps-track ol')).toBeInTheDocument();
    const arrows = container.querySelectorAll('.rnc-wizard-steps-arrow');
    expect(arrows).toHaveLength(2);
    arrows.forEach((a) => { expect(a).toHaveAttribute('tabindex', '-1'); expect(a).toHaveAttribute('aria-hidden', 'true'); });
    await waitFor(() => expect(screen.getAllByRole('button', { name: /not complete/ })).toHaveLength(6));
  });
});

describe('tables on narrow screens', () => {
  it('the Table scrolls inside a frame that shades the edge with more columns', () => {
    const { container } = render(<Table data={[{ a: 'One' }]} columns={[{ accessorKey: 'a', header: 'A' }]} caption="Sample" />);
    const wrap = container.querySelector('.rnc-table-frame > .rnc-table-wrap');
    expect(wrap).toBeInTheDocument();
    expect(wrap!.querySelector('table')).toHaveClass('rnc-table');
  });
});

describe('LicenceBadge', () => {
  it('states the province, the licence number with its label, the regulator and who verified it', () => {
    render(<LicenceBadge province="BC" number="000000" heading="p" />);
    expect(screen.getByText('Licensed in British Columbia')).toHaveClass('rnc-licence-title');
    expect(screen.getByText('BC Gaming Event Licence #000000')).toHaveClass('rnc-licence-number');
    expect(screen.getByText('Licence and security details').tagName).toBe('SUMMARY');
    expect(screen.getByRole('link', { name: 'Independent Gambling Control Office' })).toHaveAttribute('href', 'https://www.igcobc.ca');
    expect(screen.getByRole('link', { name: 'Verified by Raffle Nexus Canada' })).toHaveAttribute('href', 'https://rafflenexus.com');
  });

  it('compact: one line for the pack chooser, several licences listed', () => {
    const { container } = render(<LicenceBadge province="ON" variant="compact" licences={[{ label: 'Lottery', number: 'A1234' }, { label: '50/50', number: 'B5678' }]} />);
    expect(container.firstChild).toHaveClass('rnc-licence', 'is-compact');
    expect(screen.getByText('Licensed in Ontario')).toBeInTheDocument();
    expect(screen.getByText('AGCO Lottery Licences: Lottery #A1234 · 50/50 #B5678')).toBeInTheDocument();
  });
});
