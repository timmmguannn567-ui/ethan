import { birthdayConfig } from './config';

// The opening borrows the actual cake colors; mix in light for a softer glow.
const tint=(hex:string,amount=.28)=>{
  const rgb=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16));
  return '#'+rgb.map(value=>Math.round(value+(255-value)*amount).toString(16).padStart(2,'0')).join('');
};
export const cakePalette=birthdayConfig.colors.slice(0,6);
export const dreamPalette=cakePalette.map(color=>tint(color));
export const spectralPalette=[4,5,1,2,0,3].map(i=>dreamPalette[i]);
export const openingPaletteStyle={
  '--dream-pink-mist':cakePalette[1]+'1d',
  '--dream-blue-mist':cakePalette[4]+'1d',
  '--dream-violet-mist':cakePalette[5]+'22',
  '--dream-gold-mist':cakePalette[0]+'10',
  '--dream-mint-mist':cakePalette[3]+'12',
  '--dream-spectrum':`linear-gradient(100deg,${spectralPalette.join(',')})`,
};
