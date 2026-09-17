import { vialoureOgImage, OG_SIZE, OG_ALT } from '../../lib/brand/vialoure';

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OGImage() {
  return vialoureOgImage();
}
