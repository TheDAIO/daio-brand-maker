import crypto from 'node:crypto';

export function buildLogoSpec(req) {
  return {
    brand: req.brand,
    industry: req.industry || '',
    vibe: req.vibe?.length ? req.vibe : ['minimal', 'geometric', 'modern'],
    colors: req.colors?.length ? req.colors : [],
    iconIdeas: req.iconIdeas?.length ? req.iconIdeas : [],
    avoid: req.avoid?.length
      ? req.avoid
      : ['photorealism', 'gradients', 'tiny details', 'busy background', 'text', 'letters', 'watermarks'],
    deliverable: {
      type: 'icon-only',
      background: 'transparent'
    }
  };
}

export function buildPrompts(spec) {
  const base = [
    `Design a minimalist flat vector-style logo ICON for the brand "${spec.brand}"${spec.industry ? ` in the ${spec.industry} space` : ''}.`,
    `Vibe: ${spec.vibe.join(', ')}.`,
    spec.colors.length ? `Color palette limited to: ${spec.colors.join(', ')}.` : `Use a simple, professional 2–3 color palette.`,
    spec.iconIdeas.length ? `Icon ideas to explore: ${spec.iconIdeas.join(', ')}.` : 'Use a strong, simple geometric symbol with a clear silhouette.',
    `Constraints: ${spec.avoid.join(', ')}.`,
    'No text, no letters, no watermark, no mockups.',
    'Centered composition, clean shapes, high contrast. Solid fills. Logo should work at small sizes.',
    'Output should be suitable as a transparent-background PNG icon.'
  ].join(' ');

  // 3 candidates: same constraints, different emphasis.
  return [
    base + ' Emphasize simplicity and symmetry.',
    base + ' Emphasize negative space and a clever geometric twist.',
    base + ' Emphasize a bold mark with a friendly feel (still minimal).'
  ];
}

export function hashRequest(obj) {
  return 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}
