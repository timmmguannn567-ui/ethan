import photoList from './photos.json';
const localAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const photos = photoList.map(photo => ({...photo, src:localAsset(photo.src), thumbnail:photo.thumbnail ? localAsset(photo.thumbnail) : undefined}));
export interface Photo { id: string; src: string; thumbnail?: string; label: string; caption: string; aspect: number }
/** All personal content and visual tuning live here. Local URLs also work offline after loading. */
export const birthdayConfig = {
  name: 'Cui Cui',
  age: null as number | null,
  title: ['Cui Cui', 'Happy Birthday'],
  dedication: '宇宙那么大，所有温柔的星光都奔向你。',
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
