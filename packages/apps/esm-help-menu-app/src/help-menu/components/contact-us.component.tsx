import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRightIcon } from 'lucide-react';
import { TextLink } from '@egen-civitas/esm-framework';
import styles from './styles.module.css';

const ContactUs = () => {
  const { t } = useTranslation();
  return (
    <TextLink
      className={styles.helpButton}
      href="https://egen.alpha.vercel.com/contact"
      rel="noopener noreferrer"
      target="_blank"
    >
      {t('contact', 'Contact')}
      <ArrowUpRightIcon size={16} aria-hidden="true" />
    </TextLink>
  );
};

export default ContactUs;
