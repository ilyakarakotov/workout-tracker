/**
 * Local, offline-safe demonstration images for the built-in seed exercises.
 * Keyed by exercise id (see src/store/seed.ts). Custom user-added exercises
 * intentionally have no entry here — ExerciseThumb falls back to a badge.
 *
 * Source + license for every file is documented in ATTRIBUTIONS.md.
 */
export interface ExerciseImageMeta {
  /** filename under public/exercises/, served at `${BASE_URL}exercises/<file>` */
  file: string
  /** accessible description of what the photo shows */
  alt: string
}

export const EXERCISE_IMAGES: Record<string, ExerciseImageMeta> = {
  'bench-press': { file: 'bench-press.jpg', alt: 'A lifter pressing a barbell up from the chest while lying on a flat bench.' },
  'overhead-press': { file: 'overhead-press.jpg', alt: 'A lifter pressing a barbell overhead from shoulder height while standing.' },
  'incline-db-press': { file: 'incline-db-press.png', alt: 'Diagram of a lifter pressing dumbbells up from the chest on an inclined bench.' },
  'cable-fly': { file: 'cable-fly.jpg', alt: 'A lifter drawing two cable handles together in front of the chest.' },
  'triceps-pushdown': { file: 'triceps-pushdown.png', alt: 'Diagram of a lifter pushing a cable attachment down to extend the arms at a high pulley.' },
  'lateral-raise': { file: 'lateral-raise.png', alt: 'Diagram of a lifter raising dumbbells out to the sides at shoulder height.' },
  deadlift: { file: 'deadlift.jpg', alt: 'A lifter hinging at the hips to lift a loaded barbell from the floor.' },
  'pull-up': { file: 'pull-up.jpg', alt: 'A person hanging from a bar and pulling their chin above it.' },
  'barbell-row': { file: 'barbell-row.jpg', alt: 'A lifter bent forward at the hips, rowing a barbell to the torso.' },
  'face-pull': { file: 'face-pull.svg', alt: 'Diagram of a lifter pulling a rope cable attachment toward the face at eye level.' },
  'barbell-curl': { file: 'barbell-curl.png', alt: 'Diagram of a lifter curling a barbell up toward the shoulders with arms at the sides.' },
  'hammer-curl': { file: 'hammer-curl.png', alt: 'Diagram of a lifter curling dumbbells up with a neutral, palms-facing-in grip.' },
  squat: { file: 'squat.jpg', alt: 'A lifter with a barbell across the shoulders, bending the knees and hips to squat down.' },
  'romanian-deadlift': { file: 'romanian-deadlift.png', alt: 'Diagram of a lifter hinging at the hips with a barbell, keeping the legs nearly straight.' },
  'leg-press': { file: 'leg-press.jpg', alt: 'A person pressing a weighted sled away with their feet on a leg press machine.' },
  'leg-curl': { file: 'leg-curl.jpg', alt: 'A person curling a machine pad toward the glutes to work the hamstrings.' },
  'calf-raise': { file: 'calf-raise.gif', alt: 'Diagram of a person rising onto the toes to work the calves.' },
  plank: { file: 'plank.jpg', alt: 'A person holding a straight-body plank position supported on forearms and toes.' },
}

export function getExerciseImage(exerciseId: string): ExerciseImageMeta | undefined {
  return EXERCISE_IMAGES[exerciseId]
}
