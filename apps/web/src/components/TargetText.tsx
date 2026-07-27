import type { ContentItem, LanguageProfile } from '@polyglotte/core';

interface TargetTextProps {
  text: string;
  profile: LanguageProfile;
  /** Translittération latine, affichée sous le texte. */
  translit?: string | undefined;
  showTransliteration?: boolean;
  size?: 'lg' | 'sm';
}

/**
 * Affiche un texte dans la langue cible.
 *
 * Toute la gestion du sens d'écriture et de la translittération est concentrée
 * ici. Éparpiller ces conditions dans chaque exercice garantirait qu'un jour,
 * l'un d'eux affiche l'arabe de gauche à droite sans que personne ne le
 * remarque avant longtemps.
 */
export function TargetText({
  text,
  profile,
  translit,
  showTransliteration = true,
  size = 'lg',
}: TargetTextProps) {
  const rtl = profile.direction === 'rtl';
  const classes = ['target', size === 'sm' ? 'target--sm' : '', rtl ? 'target--rtl' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="stack stack--tight" style={{ alignItems: 'center' }}>
      <div className={classes} lang={profile.bcp47} dir={rtl ? 'rtl' : 'ltr'}>
        {text}
      </div>
      {translit && showTransliteration ? (
        <div className="translit" dir="ltr">
          {translit}
        </div>
      ) : null}
    </div>
  );
}

/** Variante prenant directement un élément de contenu. */
export function ItemTarget({
  item,
  profile,
  showTransliteration,
  size,
}: {
  item: ContentItem;
  profile: LanguageProfile;
  showTransliteration?: boolean;
  size?: 'lg' | 'sm';
}) {
  return (
    <TargetText
      text={item.target}
      profile={profile}
      translit={item.translit}
      showTransliteration={showTransliteration ?? true}
      size={size ?? 'lg'}
    />
  );
}
