import { render, screen } from '@testing-library/react'

import { AureliaInvitation } from '~/templates/aurelia/components/invitation'
import { AureliaSaveTheDate } from '~/templates/aurelia/components/save-the-date'
import { ClassicInvitation } from '~/templates/classic/components/invitation'
import { ClassicSaveTheDate } from '~/templates/classic/components/save-the-date'
import { VoyageInvitation } from '~/templates/voyage/components/invitation'
import { VoyageSaveTheDate } from '~/templates/voyage/components/save-the-date'

// Minimal wedding data; null image urls keep next/image out of the render.
const baseWedding = {
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
  date: { standardFormat: 'May 30, 2027', numberFormat: '5/30/2027' },
  daysRemaining: 100,
  events: [],
  sections: [],
  website: {
    headerImageUrl: null,
    coverPhotoUrl: null,
    isRsvpEnabled: false,
    coupleImageUrls: [],
    introText: '',
  },
}

const saveTheDateComponents = [
  ['Classic', ClassicSaveTheDate],
  ['Aurelia', AureliaSaveTheDate],
  ['Voyage', VoyageSaveTheDate],
] as const

describe.each(saveTheDateComponents)('%s Save the Date copy', (_name, Component) => {
  it('renders the couple-provided wording when present', () => {
    render(
      <Component
        path='/w/x'
        weddingData={
          {
            ...baseWedding,
            saveTheDate: {
              eyebrow: 'Mark Your Calendar',
              message: 'Come celebrate with us in Puebla.',
              footnote: 'A formal invite will follow soon.',
            },
          } as never
        }
      />
    )

    expect(screen.getByText('Mark Your Calendar')).toBeInTheDocument()
    expect(screen.getByText('Come celebrate with us in Puebla.')).toBeInTheDocument()
    expect(screen.getByText('A formal invite will follow soon.')).toBeInTheDocument()
  })

  it('falls back to the template default wording when no copy is set', () => {
    render(<Component path='/w/x' weddingData={baseWedding as never} />)

    expect(screen.getByText('Save the Date')).toBeInTheDocument()
    expect(screen.getByText('Formal invitation to follow.')).toBeInTheDocument()
  })
})

const invitationComponents = [
  ['Classic', ClassicInvitation],
  ['Aurelia', AureliaInvitation],
  ['Voyage', VoyageInvitation],
] as const

describe.each(invitationComponents)('%s Invitation copy', (_name, Component) => {
  it('renders the couple-provided wording when present', () => {
    render(
      <Component
        path='/w/x'
        weddingData={
          {
            ...baseWedding,
            invitation: {
              preface: 'With joyful hearts',
              invitationLine: 'invite you to celebrate',
              message: 'Black tie optional.',
            },
          } as never
        }
      />
    )

    expect(screen.getByText('With joyful hearts')).toBeInTheDocument()
    expect(screen.getByText('invite you to celebrate')).toBeInTheDocument()
    expect(screen.getByText('Black tie optional.')).toBeInTheDocument()
  })

  it('falls back to the template default wording when no copy is set', () => {
    render(<Component path='/w/x' weddingData={baseWedding as never} />)

    expect(screen.getByText('Together with their families')).toBeInTheDocument()
    expect(screen.getByText('request the pleasure of your company')).toBeInTheDocument()
  })
})
