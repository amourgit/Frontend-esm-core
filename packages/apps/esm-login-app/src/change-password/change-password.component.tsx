import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FieldError, useForm, type SubmitHandler } from 'react-hook-form';
import { Button, Form, PasswordInput, InlineLoading, Tile } from '@carbon/react';
import { showSnackbar } from '@egen-civitas/esm-framework';
import { useAIActionable } from '@egen-civitas/esm-ai-framework';
import { changeUserPassword } from './change-password.resource';
import Logo from '../logo.component';
import styles from './change-password.scss';

const ChangePassword: React.FC = () => {
  const { t } = useTranslation();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const oldPasswordValidation = z.string({
    required_error: t('oldPasswordRequired', 'Old password is required'),
  });

  const newPasswordValidation = z.string({
    required_error: t('newPasswordRequired', 'New password is required'),
  });

  const passwordConfirmationValidation = z.string({
    required_error: t('passwordConfirmationRequired', 'Password confirmation is required'),
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

  // ── Rendre ce formulaire "actionnable" par l'assistant IA ──────────────────
  // Chaque champ/bouton est enregistré dans le catalogue d'actions UI tant
  // qu'il est monté à l'écran (voir useAIActionable). Aucun "workflow de
  // changement de mot de passe" n'est codé ici ni ailleurs : le LLM reçoit ce
  // catalogue dans son contexte et compose lui-même la séquence
  // navigate → fill_field (x3) → click_element nécessaire pour répondre à
  // une demande de l'utilisateur, quelle que soit sa formulation.
  const oldPasswordRef = useAIActionable<HTMLInputElement>({
    id: 'change-password:old-password',
    kind: 'fill',
    label: t('oldPassword', 'Old password'),
    description: "Mot de passe actuel de l'utilisateur, requis pour confirmer le changement.",
  });
  const newPasswordRef = useAIActionable<HTMLInputElement>({
    id: 'change-password:new-password',
    kind: 'fill',
    label: t('newPassword', 'New password'),
    description: 'Nouveau mot de passe souhaité.',
  });
  const passwordConfirmationRef = useAIActionable<HTMLInputElement>({
    id: 'change-password:confirmation',
    kind: 'fill',
    label: t('confirmPassword', 'Confirm new password'),
    description: 'Doit être identique au nouveau mot de passe pour valider le formulaire.',
  });
  const submitRef = useAIActionable<HTMLButtonElement>({
    id: 'change-password:submit',
    kind: 'click',
    label: t('change', 'Change Password'),
    description:
      'Soumet le formulaire de changement de mot de passe. Ne cliquer que lorsque les 3 champs ci-dessus sont remplis.',
  });

  return (
    <div className={styles.container}>
      <Tile className={styles.changePasswordCard}>
        <div className={styles.alignCenter}>
          <Logo t={t} />
        </div>
        <Form onSubmit={handleSubmit(onSubmit, onError)}>
          <Controller
            name="oldPassword"
            control={control}
            render={({ field: { onChange, value } }) => (
              <PasswordInput
                ref={oldPasswordRef}
                id="oldPassword"
                invalid={!!errors?.oldPassword}
                invalidText={
                  (errors &&
                    errors.oldPassword &&
                    errors.oldPassword.message &&
                    typeof errors.oldPassword.message === 'string' &&
                    errors.oldPassword.message) ??
                  ''
                }
                labelText={t('oldPassword', 'Old password')}
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
                ref={newPasswordRef}
                id="newPassword"
                invalid={!!errors?.newPassword}
                invalidText={
                  (errors &&
                    errors.newPassword &&
                    errors.newPassword.message &&
                    typeof errors.newPassword.message === 'string' &&
                    errors.newPassword.message) ??
                  ''
                }
                labelText={t('newPassword', 'New password')}
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
                ref={passwordConfirmationRef}
                id="passwordConfirmation"
                invalid={!!errors?.passwordConfirmation}
                invalidText={
                  (errors &&
                    errors.passwordConfirmation &&
                    errors.passwordConfirmation.message &&
                    typeof errors.passwordConfirmation.message === 'string' &&
                    errors.passwordConfirmation.message) ??
                  ''
                }
                labelText={t('confirmPassword', 'Confirm new password')}
                onChange={onChange}
                value={value}
              />
            )}
          />
          <Button ref={submitRef} className={styles.submitButton} disabled={isChangingPassword} type="submit">
            {isChangingPassword ? (
              <InlineLoading description={t('changingPassword', 'Changing password') + '...'} />
            ) : (
              <span>{t('change', 'Change Password')}</span>
            )}
          </Button>
        </Form>
      </Tile>
    </div>
  );
};

export default ChangePassword;
