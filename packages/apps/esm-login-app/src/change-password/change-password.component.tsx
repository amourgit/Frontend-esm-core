import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FieldError, useForm, type SubmitHandler } from 'react-hook-form';
import { Button, InlineLoading, PasswordInput, showSnackbar, Tile } from '@egen-civitas/esm-framework';
import { changeUserPassword } from './change-password.resource';
import Logo from '../logo.component';
import styles from './change-password.module.css';

const ChangePassword: React.FC = () => {
  const { t } = useTranslation();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const oldPasswordValidation = z.string({
    error: (issue) => (issue.input === undefined ? t('oldPasswordRequired', 'Old password is required') : undefined),
  });

  const newPasswordValidation = z.string({
    error: (issue) => (issue.input === undefined ? t('newPasswordRequired', 'New password is required') : undefined),
  });

  const passwordConfirmationValidation = z.string({
    error: (issue) =>
      issue.input === undefined ? t('passwordConfirmationRequired', 'Password confirmation is required') : undefined,
  });

  const changePasswordFormSchema = z
    .object({
      oldPassword: oldPasswordValidation,
      newPassword: newPasswordValidation,
      passwordConfirmation: passwordConfirmationValidation,
    })
    .refine((data) => data.newPassword === data.passwordConfirmation, {
      message: t('passwordsDoNotMatch', 'Passwords do not match'),
      path: ['passwordConfirmation'],
    });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof changePasswordFormSchema>> = useCallback(
    (data) => {
      setIsChangingPassword(true);

      const { oldPassword, newPassword } = data;

      changeUserPassword(oldPassword, newPassword)
        .then(() => {
          showSnackbar({
            title: t('passwordChangedSuccessfully', 'Password changed successfully'),
            kind: 'success',
          });
        })
        .catch((error) => {
          showSnackbar({
            kind: 'error',
            subtitle: error?.message,
            title: t('errorChangingPassword', 'Error changing password'),
          });
        })
        .finally(() => {
          setIsChangingPassword(false);
        });
    },
    [t],
  );

  const onError = useCallback(() => setIsChangingPassword(false), []);

  return (
    <div className={styles.container}>
      <Tile className={styles.changePasswordCard}>
        <div className={styles.alignCenter}>
          <Logo t={t} />
        </div>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <Controller
            name="oldPassword"
            control={control}
            render={({ field: { onChange, value } }) => (
              <PasswordInput
                id="oldPassword"
                errorText={
                  (errors &&
                    errors.oldPassword &&
                    errors.oldPassword.message &&
                    typeof errors.oldPassword.message === 'string' &&
                    errors.oldPassword.message) ??
                  ''
                }
                label={t('oldPassword', 'Old password')}
                onChange={onChange}
                value={value}
              />
            )}
          />
          <Controller
            name="newPassword"
            control={control}
            render={({ field: { onChange, value } }) => (
              <PasswordInput
                id="newPassword"
                errorText={
                  (errors &&
                    errors.newPassword &&
                    errors.newPassword.message &&
                    typeof errors.newPassword.message === 'string' &&
                    errors.newPassword.message) ??
                  ''
                }
                label={t('newPassword', 'New password')}
                onChange={onChange}
                value={value}
              />
            )}
          />
          <Controller
            name="passwordConfirmation"
            control={control}
            render={({ field: { onChange, value } }) => (
              <PasswordInput
                id="passwordConfirmation"
                errorText={
                  (errors &&
                    errors.passwordConfirmation &&
                    errors.passwordConfirmation.message &&
                    typeof errors.passwordConfirmation.message === 'string' &&
                    errors.passwordConfirmation.message) ??
                  ''
                }
                label={t('confirmPassword', 'Confirm new password')}
                onChange={onChange}
                value={value}
              />
            )}
          />
          <Button className={styles.submitButton} disabled={isChangingPassword} type="submit">
            {isChangingPassword ? (
              <InlineLoading description={t('changingPassword', 'Changing password') + '...'} />
            ) : (
              <span>{t('change', 'Change Password')}</span>
            )}
          </Button>
        </form>
      </Tile>
    </div>
  );
};

export default ChangePassword;
