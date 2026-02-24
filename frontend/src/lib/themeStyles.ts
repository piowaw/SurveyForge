//Public survey theme colours

export interface ThemeStyle {
  button: string;
  accent: string;
  headerBorder: string;
  pageBg: string;
  progressBar: string;
  cardBorder: string;
  timerDefault: string;
  gateBorder: string;
}

export const THEME_STYLES: Record<string, ThemeStyle> = {
  '': {
    button: '', accent: 'text-primary', headerBorder: 'border-t-4 border-t-primary',
    pageBg: 'bg-muted/30', progressBar: 'bg-primary', cardBorder: '',
    timerDefault: '', gateBorder: '',
  },
  blue: {
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    accent: 'text-blue-600', headerBorder: 'border-t-4 border-t-blue-600',
    pageBg: 'bg-blue-50/40', progressBar: 'bg-blue-600',
    cardBorder: '',
    timerDefault: 'border-blue-200 bg-blue-50 text-blue-700',
    gateBorder: 'border-t-4 border-t-blue-400',
  },
  green: {
    button: 'bg-green-600 hover:bg-green-700 text-white',
    accent: 'text-green-600', headerBorder: 'border-t-4 border-t-green-600',
    pageBg: 'bg-green-50/40', progressBar: 'bg-green-600',
    cardBorder: '',
    timerDefault: 'border-green-200 bg-green-50 text-green-700',
    gateBorder: 'border-t-4 border-t-green-400',
  },
  purple: {
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    accent: 'text-purple-600', headerBorder: 'border-t-4 border-t-purple-600',
    pageBg: 'bg-purple-50/40', progressBar: 'bg-purple-600',
    cardBorder: '',
    timerDefault: 'border-purple-200 bg-purple-50 text-purple-700',
    gateBorder: 'border-t-4 border-t-purple-400',
  },
  rose: {
    button: 'bg-rose-600 hover:bg-rose-700 text-white',
    accent: 'text-rose-600', headerBorder: 'border-t-4 border-t-rose-600',
    pageBg: 'bg-rose-50/40', progressBar: 'bg-rose-600',
    cardBorder: '',
    timerDefault: 'border-rose-200 bg-rose-50 text-rose-700',
    gateBorder: 'border-t-4 border-t-rose-400',
  },
  orange: {
    button: 'bg-orange-500 hover:bg-orange-600 text-white',
    accent: 'text-orange-500', headerBorder: 'border-t-4 border-t-orange-500',
    pageBg: 'bg-orange-50/40', progressBar: 'bg-orange-500',
    cardBorder: '',
    timerDefault: 'border-orange-200 bg-orange-50 text-orange-700',
    gateBorder: 'border-t-4 border-t-orange-400',
  },
  teal: {
    button: 'bg-teal-600 hover:bg-teal-700 text-white',
    accent: 'text-teal-600', headerBorder: 'border-t-4 border-t-teal-600',
    pageBg: 'bg-teal-50/40', progressBar: 'bg-teal-600',
    cardBorder: '',
    timerDefault: 'border-teal-200 bg-teal-50 text-teal-700',
    gateBorder: 'border-t-4 border-t-teal-400',
  },
};
