import { Rocket, Undo2 } from 'lucide-react';
import { useHostBridge } from '../../../../lib/host-bridge';
import { useEditorStore } from '../../../../store/editor-store';
import { toast } from '../../../ui/use-toast';
import { Button } from '../../../ui/button';
import { TooltipWrapper } from '../../../tooltip-wrapper';

/** Bouton EGEN : construit le JSON de thème et le passe au moteur de thème (TokiForge). */
export function ApplyButton({ disabled }: { disabled?: boolean }) {
  const bridge = useHostBridge();
  const styles = useEditorStore((s) => s.themeState.styles);
  if (!bridge) return null;

  const onApply = () => {
    try {
      bridge.apply(styles);
      toast({ title: 'Thème appliqué', description: 'Le thème est actif sur tout le projet.' });
    } catch (error) {
      toast({ title: "Échec de l'application", description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <>
      {bridge.isApplied && (
        <TooltipWrapper label="Retirer le thème appliqué au projet" asChild>
          <Button variant="ghost" size="sm" onClick={bridge.revert} disabled={disabled}>
            <Undo2 className="size-3.5" />
          </Button>
        </TooltipWrapper>
      )}
      <TooltipWrapper label="Appliquer ce thème à tout le projet" asChild>
        <Button size="sm" onClick={onApply} disabled={disabled}>
          <Rocket className="size-3.5" />
          <span className="hidden text-sm md:block">Appliquer</span>
        </Button>
      </TooltipWrapper>
    </>
  );
}
