// utils/seo.ts
import { Locale } from '@/locales';

interface ArticlesMetaData {
  title: string;
  description: string;
}

interface HomeMetaData {
  title: string;
  description: string;
}

interface StotrasMetaData {
  title: string;
  description: string;
}

export const getHomeMetaData = (locale: Locale): HomeMetaData => {
  switch (locale) {
    case 'te':
      return {
        title: 'Telugu Calendar | Telugu Panchangam | Stotras - SS Bhakthi',
        description:
          'SS Bhakthi is hindu devotional information including Panchangam, Calendar, Stotras, Bhakthi Articles, Festivals Dates, Muhurthas and Temple guide in Telugu',
      };
    case 'en':
      return {
        title: 'Telugu Calendar | Telugu Panchangam | Stotras - SS Bhakthi',
        description:
          'SS Bhakthi is hindu devotional information including Panchangam, Calendar, Stotras, Bhakthi Articles, Festivals Dates, Muhurthas and Temple guide in English',
      };
    case 'hi':
      return {
        title: 'Telugu Calendar | Telugu Panchangam | Stotras - SS Bhakthi',
        description:
          'SS Bhakthi is hindu devotional information including Panchangam, Calendar, Stotras, Bhakthi Articles, Festivals Dates, Muhurthas and Temple guide in Hindi',
      };
    case 'kn':
      return {
        title: 'Telugu Calendar | Telugu Panchangam | Stotras - SS Bhakthi',
        description:
          'SS Bhakthi is hindu devotional information including Panchangam, Calendar, Stotras, Bhakthi Articles, Festivals Dates, Muhurthas and Temple guide in Kannada',
      };
    default:
      return {
        title: 'Telugu Calendar | Telugu Panchangam | Stotras - SS Bhakthi',
        description:
          'SS Bhakthi is hindu devotional information including Panchangam, Calendar, Stotras, Bhakthi Articles, Festivals Dates, Muhurthas and Temple guide',
      };
  }
};

export const getArticlesMetaData = (locale: Locale): ArticlesMetaData => {
  switch (locale) {
    case 'te':
      return {
        title: 'All Hindu Devotional Articles in Telugu | SS Bhakthi',
        description:
          'Read Hindu devotional articles, spiritual guides, and religious content in Telugu. Learn about festivals, traditions, rituals, and sacred practices.',
      };
    case 'en':
      return {
        title: 'All Hindu Devotional Articles in English | SS Bhakthi',
        description:
          'Read Hindu devotional articles, spiritual guides, and religious content in English. Learn about festivals, traditions, rituals, and sacred practices.',
      };
    case 'hi':
      return {
        title: 'All Hindu Devotional Articles in Hindi | SS Bhakthi',
        description:
          'Read Hindu devotional articles, spiritual guides, and religious content in Hindi. Learn about festivals, traditions, rituals, and sacred practices.',
      };
    case 'kn':
      return {
        title: 'All Hindu Devotional Articles in Kannada | SS Bhakthi',
        description:
          'Read Hindu devotional articles, spiritual guides, and religious content in Kannada. Learn about festivals, traditions, rituals, and sacred practices.',
      };
    default:
      return {
        title: 'All Hindu Devotional Articles | SS Bhakthi',
        description:
          'Read Hindu devotional articles, spiritual guides, and religious content. Learn about festivals, traditions, rituals, and sacred practices.',
      };
  }
};

export const getStotrasMetaData = (locale: Locale): StotrasMetaData => {
  switch (locale) {
    case 'te':
      return {
        title: 'All Devotional Stotras with Lyrics in Telugu | SS Bhakthi',
        description:
          'All Devotional Stotras like Stotras, Kavachas, Stuthi, Bhajan, Hrudaya, Ashtakass, shodasha nama .. etc. Everyone Can uderstand And read Stotras in Telugu.',
      };
    case 'en':
      return {
        title: 'All Devotional Stotras with Lyrics in English | SS Bhakthi',
        description:
          'All Devotional Stotras like Stotras, Kavachas, Stuthi, Bhajan, Hrudaya, Ashtakass, shodasha nama .. etc. Everyone Can uderstand And read Stotras in English.',
      };
    case 'hi':
      return {
        title: 'All Devotional Stotras with Lyrics in Hindi | SS Bhakthi',
        description:
          'All Devotional Stotras like Stotras, Kavachas, Stuthi, Bhajan, Hrudaya, Ashtakass, shodasha nama .. etc. Everyone Can uderstand And read Stotras in Hindi.',
      };
    case 'kn':
      return {
        title: 'All Devotional Stotras with Lyrics in Kannada | SS Bhakthi',
        description:
          'All Devotional Stotras like Stotras, Kavachas, Stuthi, Bhajan, Hrudaya, Ashtakass, shodasha nama .. etc. Everyone Can uderstand And read Stotras in Kannada.',
      };
    default:
      return {
        title: 'All Devotional Stotras with Lyrics | SS Bhakthi',
        description:
          'All Devotional Stotras like Stotras, Kavachas, Stuthi, Bhajan, Hrudaya, Ashtakass, shodasha nama .. etc. Everyone Can uderstand And read Stotras.',
      };
  }
};

export const getArticleDetailMetaData = (seoTitle: string): { title: string } => {
  return {
    title: seoTitle,
  };
};

export const getStotraDetailMetaData = (seoTitle: string): { title: string } => {
  return {
    title: seoTitle,
  };
};
