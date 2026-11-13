import React from 'react';
import { Button, InlineNotification } from '@carbon/react';

interface State {
  error: Error | null;
}

/** Isole les erreurs de rendu du Studio : un thème cassé ne doit pas faire tomber la page (ni le shell). */
export class StudioErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert">
        <InlineNotification kind="error" lowContrast hideCloseButton title="Le Theme Studio a rencontré une erreur" subtitle={this.state.error.message} />
        <Button kind="tertiary" size="sm" onClick={() => this.setState({ error: null })}>
          Réessayer
        </Button>
      </div>
    );
  }
}
