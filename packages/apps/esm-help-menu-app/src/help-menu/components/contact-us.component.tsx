import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from '@carbon/react/icons';
import { Link } from '@carbon/react';
import styles from './styles.scss';

const ContactUs = () => {
  const { t } = useTranslation();
  return (
    <Link
      className={styles.helpButton}
      href="https://egen.alpha.vercel.com/contact"
      rel="noopener noreferrer"
      renderIcon={ArrowUpRight}
      target="_blank"
    >
      {t('contact', 'Contact')}
    </Link>
  );
};

export default ContactUs;
