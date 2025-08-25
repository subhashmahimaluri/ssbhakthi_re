import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.scss';

import { LocationProvider } from '@/context/LocationContext';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { Hind_Guntur, Nunito_Sans } from 'next/font/google';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import { useEffect } from 'react';

const hindGuntur = Hind_Guntur({
  subsets: ['latin'],
  variable: '--font-hind-guntur',
  weight: ['300', '400', '500', '600', '700'],
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  weight: ['300', '400', '600', '700', '800'],
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    require('bootstrap/dist/js/bootstrap.bundle.min.js');

    NProgress.start();

    const locale = router.locale || 'te';

    // Set dynamic font + locale class on body
    const bodyClassList = document.body.classList;
    bodyClassList.remove('instance-te', 'instance-en', 'instance-hi', 'instance-kn');
    bodyClassList.remove(hindGuntur.variable, nunitoSans.variable);

    if (locale === 'te') {
      bodyClassList.add('instance-te', hindGuntur.variable);
    } else {
      bodyClassList.add('instance-en', nunitoSans.variable);
    }

    setTimeout(() => {
      NProgress.done();
    }, 500);
  }, [router]);

  return (
    <SessionProvider session={pageProps.session}>
      <LocationProvider>
        <Component {...pageProps} />
      </LocationProvider>
    </SessionProvider>
  );
}
