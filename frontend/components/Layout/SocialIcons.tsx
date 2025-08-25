import Link from 'next/link';

const SocialIcons = () => {
  const iconClassName = 'text-storm gr-hover-text-white';

  return (
    <ul className="social-icons list-unstyled mb-lg-0 mb-1 mt-1 py-2">
      <li className="me-0">
        <Link href="https://www.facebook.com/nrsharmatv" className={iconClassName}>
          <i className="icon fab fa-twitter"></i>
        </Link>
      </li>
      <li className="me-0">
        <Link href="https://twitter.com/NRSharmaTV" className={iconClassName}>
          <i className="icon fab fa-facebook"></i>
        </Link>
      </li>
      <li className="me-0">
        <Link href="https://www.instagram.com/ssbhakthi/" className={iconClassName}>
          <i className="icon fab fa-instagram"></i>
        </Link>
      </li>
      <li className="me-0">
        <Link href="https://in.pinterest.com/nrsharmatv/" className={iconClassName}>
          <i className="icon fab fa-pinterest"></i>
        </Link>
      </li>
    </ul>
  );
};

export default SocialIcons;
