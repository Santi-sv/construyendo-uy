export type ContactChannel = 'whatsapp' | 'phone'
export const CONTACT_LAUNCH_DELAY = 1250
export const CONTACT_RESET_DELAY = 2500

type ContactWindow = { opener: unknown; location: { replace: (href: string) => void }; close: () => void }
export type ContactPlatform = { open: () => ContactWindow | null; navigate: (href: string) => void }

// Opening after the animation can be blocked by the browser. In that case,
// ordinary navigation still opens the destination without leaving an empty tab.
export function launchContact(href: string, channel: ContactChannel, platform: ContactPlatform = {
  open: () => window.open('about:blank', '_blank'),
  navigate: (destination) => window.location.assign(destination),
}) {
  if (channel === 'phone') {
    platform.navigate(href)
    return
  }
  let opened: ContactWindow | null = null
  try {
    opened = platform.open()
    if (opened) {
      opened.opener = null
      opened.location.replace(href)
      return
    }
  } catch {
    opened?.close()
  }
  platform.navigate(href)
}
