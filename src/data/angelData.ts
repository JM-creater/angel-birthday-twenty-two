export interface LetterContent {
  recipientTitle: string;
  greeting: string;
  paragraphs: string[];
  closing: string;
  signature: string;
}

export const DEFAULT_LETTER_CONTENT: LetterContent = {
  recipientTitle: 'For My Beautiful Lablab • Turning 22 ✨',
  greeting: 'Happy 22nd Birthday, My Lablab,',
  paragraphs: [
    'Twenty-two years ago today, the world became infinitely softer, warmer, and brighter because you arrived in it. They named you Angel, and honestly, bagay jud kaayo sa imoha—because from the moment you walked into my life, ikaw na jud akong pahulay, my safe haven, and my greatest blessing.',
    'Watching you grow into the woman you are at 22 fills my heart with so much pride. Ganahan kaayo ko magtan-aw the way your eyes light up when you talk about the things you love, the sound of your laugh when magpabadlong ko just to see you smile, and the gentle kindness you carry in your heart bisan pa on your hardest days.',
    'Salamat kaayo for every late-night conversation, every quiet comfort, every shared meal, and every memory we have built together. Basta ikaw akong kuyog, my Lablab, bisan ang pinakasimple nga adlaw feels like magic.',
    'As you blow out your candles for Chapter 22, I pray that this year gives back to you all the love and warmth you effortlessly pour into everyone around you. Whatever dreams you chase this year, timan-i nga naa ra ko pirmi sa imong kilid—cheering the loudest, holding your hand, and loving you more than yesterday. Gimingaw ug palangga tika pirmi.'
  ],
  closing: 'Forever yours, always and in all ways,',
  signature: 'Your Big Baby ❤️'
};
