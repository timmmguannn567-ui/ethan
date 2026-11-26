import photoList from './photos.json';
const localAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const embedded: Record<string,string> = JSON.parse(document.getElementById('birthday-photos')?.textContent || '{}');
export const caption19 = JSON.parse(document.getElementById('birthday-inscriptions')?.textContent || '{}')['19'] || localAsset('/photos/19-inscription.jpg');
const photos = photoList.map(photo => ({...photo, src:localAsset(photo.src), thumbnail:embedded[photo.id] || localAsset(photo.thumbnail || photo.src)}));
export interface Photo { id: string; src: string; thumbnail?: string; label: string; caption: string; aspect: number; frame?: boolean; captionOverlay?: boolean }
/** All personal content and visual tuning live here. Local URLs also work offline after loading. */
export const birthdayConfig = {
  name: 'Cui Cui',
  age: null as number | null,
  opening: {
    enabled: true,
    countdownBeatMs: 1350,
    invitation: '有些相遇，让普通的日子开始发光。',
    nameMessage: '宇宙那么大，很高兴遇见你。',
    wishMessage: '愿你的心愿，都有温柔的回响。',
    closingMessage: '你的每一个生日，\n都值得被认真珍藏。',
  },
  title: ['Cui Cui', 'Happy Birthday'],
  dedication: '你的每一个生日对你对我都有特殊的意义，生日快乐～',
  wish: '愿你迎着阳光出发，走向自己喜欢的生活。',
  colors: ['#ffc43d', '#ffa1c8', '#ff5435', '#30d492', '#41c9ed', '#b481ef', '#fff4db', '#34304c'],
  marbleCount: { desktop: 510, mobile: 360, low: 270 },
  particleCount: { desktop: 100, mobile: 65 },
  animationDuration: 2.1,
  music: { enabled: true, volume: 0.24 },
  autoRotationSpeed: 0.045,
  seed: 1027,
  photos: photos as Photo[],
  placeholder: localAsset('/photos/placeholder.svg'),
};
