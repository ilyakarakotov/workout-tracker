# Exercise image attributions

All exercise demonstration images live in `public/exercises/` and are served
at `${BASE_URL}exercises/<file>`. Every file was downloaded from Wikimedia
Commons via its `Special:FilePath` thumbnail endpoint (`?width=320`), which
re-encodes but does not otherwise alter the image, except `face-pull.svg`,
which is original artwork created for this project (see note below).

Mapping from exercise id to file lives in `src/lib/exerciseImages.ts`.

| Exercise | Local file | Source (Commons file page) | License | Author / credit |
|---|---|---|---|---|
| Bench Press | `bench-press.jpg` | [File:Bench_press_1.jpg](https://commons.wikimedia.org/wiki/File:Bench_press_1.jpg) | Public domain (`PD-USGov-Military-Marines`) | Lance Cpl. Ronald W. Stauffer, USMC |
| Overhead Press | `overhead-press.jpg` | [File:Attractive_sporty_woman_doing_overhead_press_in_gym_with_barbell.jpg](https://commons.wikimedia.org/wiki/File:Attractive_sporty_woman_doing_overhead_press_in_gym_with_barbell.jpg) | CC BY 2.0 | Nenad Stojkovic (via Flickr) |
| Incline Dumbbell Press | `incline-db-press.png` | [File:Incline_dumbbell_press_1.svg](https://commons.wikimedia.org/wiki/File:Incline_dumbbell_press_1.svg) | CC BY-SA 3.0 | Everkinetic |
| Cable Fly | `cable-fly.jpg` | [File:Personal_Training_at_a_Gym_-_Cable_Crossover.JPG](https://commons.wikimedia.org/wiki/File:Personal_Training_at_a_Gym_-_Cable_Crossover.JPG) | CC BY-SA 3.0 (dual-licensed with GFDL 1.2+) | LocalFitness Pty Ltd (localfitness.com.au) |
| Triceps Pushdown | `triceps-pushdown.png` | [File:Triceps_pushdown_with_cable_1.svg](https://commons.wikimedia.org/wiki/File:Triceps_pushdown_with_cable_1.svg) | CC BY-SA 3.0 | Everkinetic |
| Lateral Raise | `lateral-raise.png` | [File:Dumbbell-lateral-raises-1.png](https://commons.wikimedia.org/wiki/File:Dumbbell-lateral-raises-1.png) | CC BY-SA 3.0 | Everkinetic |
| Deadlift | `deadlift.jpg` | [File:Deadlift_Barbell.JPG](https://commons.wikimedia.org/wiki/File:Deadlift_Barbell.JPG) | CC BY-SA 2.0 | stu_spivack / Stuart Spivack (via Flickr) |
| Pull-Up | `pull-up.jpg` | [File:Girl_doing_pull_up_top_position.jpg](https://commons.wikimedia.org/wiki/File:Girl_doing_pull_up_top_position.jpg) | CC BY 2.0 | PTPioneer (Tyler Read), ptpioneer.com |
| Barbell Row | `barbell-row.jpg` | [File:Barbell_row.jpg](https://commons.wikimedia.org/wiki/File:Barbell_row.jpg) | CC BY 2.0 | embhoo (via Flickr) |
| Face Pull | `face-pull.svg` | — original artwork — | Original work for this project | Created for Workout; not sourced from Commons (see note) |
| Barbell Curl | `barbell-curl.png` | [File:Wide_grip_standing_biceps_curl_with_barbell_2.svg](https://commons.wikimedia.org/wiki/File:Wide_grip_standing_biceps_curl_with_barbell_2.svg) | CC BY-SA 3.0 | Everkinetic |
| Hammer Curl | `hammer-curl.png` | [File:Bicep_hammer_curl_with_dumbbell_1.svg](https://commons.wikimedia.org/wiki/File:Bicep_hammer_curl_with_dumbbell_1.svg) | CC BY-SA 3.0 | Everkinetic |
| Squat | `squat.jpg` | [File:Woman_doing_squat_workout_in_gym_with_barbell,_back_view.jpg](<https://commons.wikimedia.org/wiki/File:Woman_doing_squat_workout_in_gym_with_barbell,_back_view.jpg>) | CC BY 2.0 | Nenad Stojkovic (via Flickr) |
| Romanian Deadlift | `romanian-deadlift.png` | [File:Romanian-deadlift-1.png](https://commons.wikimedia.org/wiki/File:Romanian-deadlift-1.png) | CC BY-SA 3.0 | Everkinetic |
| Leg Press | `leg-press.jpg` | [File:Young_man_using_a_leg_press_machine_at_the_gym.jpg](https://commons.wikimedia.org/wiki/File:Young_man_using_a_leg_press_machine_at_the_gym.jpg) | CC BY 2.0 | Nenad Stojkovic (via Flickr) |
| Leg Curl | `leg-curl.jpg` | [File:LyingLegCurlMachineExercise.JPG](https://commons.wikimedia.org/wiki/File:LyingLegCurlMachineExercise.JPG) | CC BY-SA 3.0 (dual-licensed with GFDL 1.2+) | GeorgeStepanek (per file page copyright claim) |
| Calf Raise | `calf-raise.gif` | [File:Standing-barbell-calf-raise-1.gif](https://commons.wikimedia.org/wiki/File:Standing-barbell-calf-raise-1.gif) | CC BY-SA 3.0 | Everkinetic |
| Plank | `plank.jpg` | [File:Fitness_enthusiast_performs_plank_exercise_at_home_on_yoga_mat.jpg](https://commons.wikimedia.org/wiki/File:Fitness_enthusiast_performs_plank_exercise_at_home_on_yoga_mat.jpg) | CC BY 2.0 | Shixart1985 (own work) |

## Notes

- **Face Pull**: no Wikimedia Commons file could be found that clearly depicts
  the cable face-pull movement under a verifiable open license (searched
  directly and via MediaSearch/full-text search; only unrelated homonyms
  turned up — a facial expression called "face pulling" and an unrelated
  church carving). Rather than substitute a visually-similar-but-different
  exercise (e.g. a rear-delt row) under a misleading label, `face-pull.svg`
  is original line-art authored for this project. It carries no external
  license restriction.
- CC BY / CC BY-SA licenses require attribution, which this file provides.
  They do not require attribution to be shown in the app UI itself.
- The Everkinetic diagram set (`db.everkinetic.com`) is a uniformly
  CC BY-SA 3.0 collection hosted in Commons' "Weight training diagrams"
  category; it was used where no clearly-licensed on-topic photograph could
  be verified.
- All raster photos were fetched at `width=320` via Commons'
  `Special:FilePath` thumbnailing endpoint, which serves a resized copy of
  the original — appropriate given these render as small in-app thumbnails
  (max 88px, retina-scaled). No further recompression was applied.
